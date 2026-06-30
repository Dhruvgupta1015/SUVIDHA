/**
 * evidenceValidator.js — Deterministic Mock-AI Evidence Intelligence Engine for SUVIDHA
 *
 * Fully deterministic: same filename + description + serviceType → ALWAYS same score.
 * No Math.random(). No external APIs.
 *
 * Scoring formula:
 *   +0.20 per filename keyword match (capped at 3 = +0.60)
 *   +0.10 per description keyword match (capped at 3 = +0.30)
 *   +0.20 if serviceType keyword appears in filename (strong service signal)
 *   Minimum score: 0.15  |  Maximum: 0.99
 *   confidence < 0.50 → flagged = true, verified = false
 *
 * Used by: requestController.js (createRequest, reuploading evidence)
 */

// ─── Keyword maps per service type ────────────────────────────────────────────
const SERVICE_KEYWORDS = {
  electricity: [
    'bill', 'meter', 'electricity', 'electric', 'power', 'transformer',
    'wire', 'wiring', 'voltage', 'current', 'outage', 'bescom', 'ebill',
    'connection', 'phase', 'substation', 'grid', 'fuse', 'circuit'
  ],
  water: [
    'water', 'leakage', 'leak', 'pipe', 'pipeline', 'bill', 'supply',
    'bwssb', 'tap', 'drain', 'sewage', 'municipal', 'reservoir', 'tank',
    'plumb', 'flow', 'contamination', 'dirty'
  ],
  gas: [
    'gas', 'cylinder', 'meter', 'leak', 'pipeline', 'png', 'lpg',
    'valve', 'gail', 'pressure', 'burner', 'connection', 'smell', 'odour'
  ],
  waste: [
    'garbage', 'waste', 'trash', 'cleaning', 'bbmp', 'dustbin', 'bin',
    'litter', 'dump', 'debris', 'sewage', 'drain', 'sanitation', 'solid'
  ],
  general: [] // general accepts anything — no keyword restriction
};

// ─── Suspicious filename patterns ─────────────────────────────────────────────
const SUSPICIOUS_PATTERNS = [
  'selfie', 'meme', 'fun', 'joke', 'test', 'sample', 'blank', 'dummy',
  'random', 'placeholder', 'untitled', 'new file', 'screenshot', 'photo',
  'profile', 'avatar', 'wallpaper', 'temp', 'copy of'
];

/**
 * Deterministic confidence scorer.
 *
 * @param {string} fileName    - Original filename (e.g. "electricity_bill_jan.pdf")
 * @param {string} serviceType - One of: electricity, water, gas, waste, general
 * @param {string} description - Complaint description (secondary signal)
 * @returns {{ relevant: boolean, confidence: number, flagged: boolean, reason: string }}
 */
export function scoreDocument(fileName, serviceType, description = '') {
  const nameLower = (fileName || '').toLowerCase();
  const descLower = (description || '').toLowerCase();
  const keywords  = SERVICE_KEYWORDS[serviceType] || [];

  // ── General service: accept all, fixed scores ─────────────────────────────
  if (serviceType === 'general') {
    const isSuspicious = SUSPICIOUS_PATTERNS.some(p => nameLower.includes(p));
    const confidence   = isSuspicious ? 0.42 : 0.82;
    return {
      relevant:   true,
      confidence,
      flagged:    confidence < 0.50,
      reason:     isSuspicious
        ? 'Filename pattern suggests non-official content'
        : 'General category — accepted'
    };
  }

  // ── Count keyword hits ────────────────────────────────────────────────────
  let nameMatches = 0;
  let descMatches = 0;

  for (const kw of keywords) {
    if (nameLower.includes(kw)) nameMatches++;
    if (descLower.includes(kw)) descMatches++;
  }

  // ── Suspicious filename check ─────────────────────────────────────────────
  const isSuspicious = SUSPICIOUS_PATTERNS.some(p => nameLower.includes(p));

  // ── Relevance gate: need ≥1 match total, not suspicious ──────────────────
  const relevant = (nameMatches + descMatches) >= 1 && !isSuspicious;

  // ── Deterministic confidence formula ─────────────────────────────────────
  // Suspicious floor
  if (isSuspicious) {
    const confidence = 0.18; // fixed suspicious floor — always 0.18
    return {
      relevant:   false,
      confidence,
      flagged:    true,
      reason:     'Filename pattern suggests non-official content'
    };
  }

  // Base: 0.15 minimum
  let score = 0.15;

  // +0.20 per filename keyword match, max 3 matches = +0.60
  score += Math.min(nameMatches, 3) * 0.20;

  // +0.10 per description keyword match, max 3 = +0.30
  score += Math.min(descMatches, 3) * 0.10;

  // +0.20 bonus if serviceType name itself appears in filename (strong signal)
  if (nameLower.includes(serviceType)) score += 0.20;

  // Clamp to [0.15, 0.99]
  const confidence = Math.min(0.99, Math.max(0.15, Math.round(score * 100) / 100));

  const flagged = confidence < 0.50;

  // ── Human-readable reason ────────────────────────────────────────────────
  let reason;
  if (nameMatches >= 3)      reason = `Strong filename match (${nameMatches} keywords found)`;
  else if (nameMatches >= 2) reason = `Good filename match (${nameMatches} keywords matched)`;
  else if (nameMatches >= 1) reason = `Filename keyword match for ${serviceType}`;
  else if (descMatches >= 2) reason = 'Multiple description keywords match (filename neutral)';
  else if (descMatches >= 1) reason = 'Description keyword match (filename neutral)';
  else                       reason = 'No relevant keywords found in filename or description';

  return { relevant, confidence, flagged, reason };
}

/**
 * Validate and score all documents for a complaint submission.
 *
 * @param {Array}  documents   - Array of { name, path } objects from client
 * @param {string} serviceType - Service category
 * @param {string} description - Complaint description
 * @returns {{ valid: boolean, message: string, scoredDocs: Array }}
 */
export function validateAndScoreDocuments(documents, serviceType, description) {
  // Mandatory proof for non-general service types
  if (serviceType !== 'general' && (!documents || documents.length === 0)) {
    return {
      valid:      false,
      message:    'Supporting evidence required for this complaint. Please upload at least one relevant document.',
      scoredDocs: []
    };
  }

  // General without docs is fine
  if (!documents || documents.length === 0) {
    return { valid: true, message: '', scoredDocs: [] };
  }

  const scoredDocs = [];

  for (const doc of documents) {
    const { relevant, confidence, flagged, reason } = scoreDocument(
      doc.name || '',
      serviceType,
      description
    );

    // Reject irrelevant documents for non-general complaints
    if (!relevant && serviceType !== 'general') {
      return {
        valid:   false,
        message: `Uploaded document "${doc.name}" does not match complaint type. Please upload relevant ${serviceType} evidence (e.g. bill, meter reading, inspection photo).`,
        scoredDocs: []
      };
    }

    scoredDocs.push({
      name:       doc.name,
      secureUrl:  doc.secureUrl || doc.path,
      publicId:   doc.publicId || doc.name,
      mimeType:   doc.mimeType,
      size:       doc.size,
      verified:   !flagged,
      confidence,
      flagged,
      reason
    });
  }

  return { valid: true, message: '', scoredDocs };
}

/**
 * Re-score a single document for re-upload flow.
 * Returns scored doc object ready for DB storage.
 */
export function rescoreDocument(fileName, filePath, serviceType, description) {
  const { relevant, confidence, flagged, reason } = scoreDocument(
    fileName,
    serviceType,
    description
  );
  return {
    name:       fileName,
    path:       filePath,
    verified:   !flagged && relevant,
    confidence,
    flagged,
    reason
  };
}
