/**
 * priorityEngine.js — Cumulative AI Priority & Urgency Engine for SUVIDHA
 *
 * Upgrade: Multi-keyword severity STACKING.
 * Instead of first-match, every keyword adds to a cumulative score.
 * Higher total score → higher urgency tier.
 *
 * Score thresholds:
 *   8+   → Critical (Emergency)   isEmergency = true
 *   4–7  → Critical               isEmergency = false
 *   2–3  → High
 *   0–1  → Standard
 *
 * Returns: { priority, priorityScore, priorityReason, isEmergency }
 */

// ─── Scored keyword map (keyword → weight) ────────────────────────────────────
const CRITICAL_SCORED = [
  { kw: 'electrocution',    score: 4 },
  { kw: 'transformer blast',score: 4 },
  { kw: 'explosion',        score: 4 },
  { kw: 'electric shock',   score: 4 },
  { kw: 'building collapse',score: 4 },
  { kw: 'fire',             score: 3 },
  { kw: 'gas leak',         score: 3 },
  { kw: 'flood',            score: 3 },
  { kw: 'flooding',         score: 3 },
  { kw: 'sewage overflow',  score: 3 },
  { kw: 'short circuit',    score: 3 },
  { kw: 'live wire',        score: 3 },
  { kw: 'exposed wire',     score: 3 },
  { kw: 'burst main',       score: 3 },
  { kw: 'road accident',    score: 3 },
  { kw: 'major leak',       score: 3 },
  { kw: 'chemical leak',    score: 3 },
  { kw: 'oil spill',        score: 3 },
  { kw: 'toxic',            score: 3 },
  { kw: 'emergency',        score: 2 },
];

const HIGH_SCORED = [
  { kw: 'water leakage',    score: 2 },
  { kw: 'leakage',          score: 2 },
  { kw: 'streetlight off',  score: 2 },
  { kw: 'no streetlight',   score: 2 },
  { kw: 'garbage overflow', score: 2 },
  { kw: 'power outage',     score: 2 },
  { kw: 'no power',         score: 2 },
  { kw: 'blackout',         score: 2 },
  { kw: 'broken pipeline',  score: 2 },
  { kw: 'pipeline broken',  score: 2 },
  { kw: 'pipeline burst',   score: 2 },
  { kw: 'road blockage',    score: 2 },
  { kw: 'road blocked',     score: 2 },
  { kw: 'no water supply',  score: 2 },
  { kw: 'water cut',        score: 2 },
  { kw: 'no electricity',   score: 2 },
  { kw: 'electricity gone', score: 2 },
  { kw: 'connection dead',  score: 2 },
  { kw: 'voltage drop',     score: 1 },
  { kw: 'pothole',          score: 1 },
  { kw: 'low pressure',     score: 1 },
  { kw: 'meter fault',      score: 1 },
  { kw: 'sewage smell',     score: 1 },
  { kw: 'drain blocked',    score: 1 },
  { kw: 'overflow',         score: 1 },
  { kw: 'overflowing',      score: 1 },
];

/**
 * Cumulative priority scoring from description + sub-service text.
 *
 * @param {string} description - Citizen complaint description
 * @param {string} subService  - Sub-service category chosen
 * @returns {{
 *   priority: string,
 *   priorityScore: number,
 *   priorityReason: string,
 *   isEmergency: boolean
 * }}
 */
export function detectPriority(description = '', subService = '') {
  const text = `${description} ${subService}`.toLowerCase();

  let totalScore = 0;
  const matchedKeywords = [];

  // ── Score ALL critical keywords present ──────────────────────────────────────
  for (const { kw, score } of CRITICAL_SCORED) {
    if (text.includes(kw)) {
      totalScore += score;
      matchedKeywords.push(`"${kw}" (+${score})`);
    }
  }

  // ── Score ALL high-urgency keywords present ───────────────────────────────────
  for (const { kw, score } of HIGH_SCORED) {
    if (text.includes(kw)) {
      totalScore += score;
      matchedKeywords.push(`"${kw}" (+${score})`);
    }
  }

  // ── Tier classification ───────────────────────────────────────────────────────
  const keywordSummary = matchedKeywords.slice(0, 4).join(', '); // cap to 4 for readability

  if (totalScore >= 8) {
    return {
      priority:       'Critical',
      priorityScore:  totalScore,
      priorityReason: `AI cumulative score ${totalScore}/8+ → Critical Emergency. Triggers: ${keywordSummary || 'multi-hazard'}`,
      isEmergency:    true
    };
  }

  if (totalScore >= 4) {
    return {
      priority:       'Critical',
      priorityScore:  totalScore,
      priorityReason: `AI cumulative score ${totalScore}/4–7 → Critical. Triggers: ${keywordSummary}`,
      isEmergency:    false
    };
  }

  if (totalScore >= 2) {
    return {
      priority:       'High',
      priorityScore:  totalScore,
      priorityReason: `AI cumulative score ${totalScore}/2–3 → High urgency. Triggers: ${keywordSummary}`,
      isEmergency:    false
    };
  }

  // ── Standard (score 0–1) ──────────────────────────────────────────────────────
  return {
    priority:       'Standard',
    priorityScore:  totalScore,
    priorityReason: totalScore === 1
      ? `AI score ${totalScore} — low urgency signal. Triggers: ${keywordSummary}`
      : 'No urgency keywords detected — routine complaint',
    isEmergency:    false
  };
}
