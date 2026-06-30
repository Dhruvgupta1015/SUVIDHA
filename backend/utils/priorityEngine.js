/**
 * priorityEngine.js — Deterministic AI Priority & Urgency Engine for SUVIDHA
 *
 * Analyses complaint description + subService to auto-assign priority.
 * No external APIs — pure keyword pattern matching.
 *
 * Priority tiers:
 *   Critical → fire, gas leak, electrocution, explosion, sewage overflow, flood …
 *   High     → water leakage, streetlight, garbage overflow, power outage …
 *   Standard → everything else
 *
 * Returns: { priority, priorityReason, isEmergency }
 */

// ─── Critical emergency keywords ──────────────────────────────────────────────
const CRITICAL_KEYWORDS = [
  'fire', 'gas leak', 'electrocution', 'transformer blast', 'explosion',
  'short circuit', 'sewage overflow', 'flood', 'flooding', 'electric shock',
  'exposed wire', 'live wire', 'major leak', 'burst main', 'road accident',
  'building collapse', 'oil spill', 'chemical leak', 'toxic', 'emergency'
];

// ─── High urgency keywords ─────────────────────────────────────────────────
const HIGH_KEYWORDS = [
  'water leakage', 'leakage', 'streetlight off', 'no streetlight',
  'garbage overflow', 'power outage', 'no power', 'blackout',
  'broken pipeline', 'pipeline broken', 'road blockage', 'road blocked',
  'pothole', 'no water supply', 'water cut', 'low pressure', 'meter fault',
  'sewage smell', 'drain blocked', 'overflow', 'overflowing', 'pipeline burst',
  'electricity gone', 'no electricity', 'connection dead', 'voltage drop'
];

/**
 * Auto-detect priority from description and sub-service text.
 *
 * @param {string} description - Citizen complaint description
 * @param {string} subService  - Sub-service category chosen
 * @returns {{ priority: string, priorityReason: string, isEmergency: boolean }}
 */
export function detectPriority(description = '', subService = '') {
  const text = `${description} ${subService}`.toLowerCase();

  // ── Critical pass ──────────────────────────────────────────────────────────
  for (const kw of CRITICAL_KEYWORDS) {
    if (text.includes(kw)) {
      return {
        priority:       'Critical',
        priorityReason: `AI detected critical keyword: "${kw}"`,
        isEmergency:    true
      };
    }
  }

  // ── High urgency pass ──────────────────────────────────────────────────────
  for (const kw of HIGH_KEYWORDS) {
    if (text.includes(kw)) {
      return {
        priority:       'High',
        priorityReason: `AI detected urgency keyword: "${kw}"`,
        isEmergency:    false
      };
    }
  }

  // ── Standard default ───────────────────────────────────────────────────────
  return {
    priority:       'Standard',
    priorityReason: 'No urgency keywords detected — routine complaint',
    isEmergency:    false
  };
}
