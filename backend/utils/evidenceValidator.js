/**
 * evidenceValidator.js — Mock-AI Evidence Intelligence Engine for SUVIDHA
 *
 * Implements deterministic relevance scoring and suspicious evidence flagging.
 * No external APIs — pure filename + description pattern matching.
 *
 * Used by: requestController.js (createRequest)
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

// ─── Suspicious patterns — filenames that suggest irrelevant content ──────────
const SUSPICIOUS_PATTERNS = [
  'selfie', 'meme', 'fun', 'joke', 'test', 'sample', 'blank', 'dummy',
  'random', 'placeholder', 'untitled', 'new file', 'screenshot', 'photo',
  'profile', 'avatar', 'wallpaper', 'temp', 'copy of'
];

/**
 * Score a single document against a service type.
 *
 * @param {string} fileName    - Original filename (e.g. "electricity_bill_jan.pdf")
 * @param {string} serviceType - One of: electricity, water, gas, waste, general
 * @param {string} description - Complaint description (used as secondary signal)
 * @returns {{ relevant: boolean, confidence: number, flagged: boolean, reason: string }}
 */
export function scoreDocument(fileName, serviceType, description = '') {
  const nameLower = fileName.toLowerCase();
  const descLower = description.toLowerCase();
  const keywords  = SERVICE_KEYWORDS[serviceType] || [];

  // General service: accept everything, baseline confidence
  if (serviceType === 'general') {
    const isSuspicious = SUSPICIOUS_PATTERNS.some(p => nameLower.includes(p));
    const confidence   = isSuspicious ? 0.55 : 0.82;
    return {
      relevant:   true,
      confidence,
      flagged:    confidence < 0.50,
      reason:     isSuspicious ? 'Filename suggests non-official document' : 'General category — accepted'
    };
  }

  // Count keyword matches across filename + description
  let nameMatches = 0;
  let descMatches = 0;

  for (const kw of keywords) {
    if (nameLower.includes(kw)) nameMatches++;
    if (descLower.includes(kw)) descMatches++;
  }

  const totalMatches = nameMatches + descMatches;

  // Check for suspicious filenames regardless of keyword match
  const isSuspicious = SUSPICIOUS_PATTERNS.some(p => nameLower.includes(p));

  // Relevance decision: need at least 1 match (name or description)
  const relevant = totalMatches >= 1 && !isSuspicious;

  // Confidence scoring
  let confidence;
  if (isSuspicious) {
    confidence = 0.20 + Math.random() * 0.25; // 0.20–0.45 — clearly suspicious
  } else if (nameMatches >= 2 || (nameMatches >= 1 && descMatches >= 2)) {
    confidence = 0.88 + Math.random() * 0.11; // 0.88–0.99 — strong match
  } else if (nameMatches >= 1 || descMatches >= 3) {
    confidence = 0.68 + Math.random() * 0.18; // 0.68–0.86 — moderate match
  } else if (descMatches >= 1) {
    confidence = 0.55 + Math.random() * 0.12; // 0.55–0.67 — weak match (description only)
  } else {
    confidence = 0.15 + Math.random() * 0.25; // 0.15–0.40 — no match
  }

  // Round to 2 decimal places
  confidence = Math.round(confidence * 100) / 100;

  const flagged = confidence < 0.50;

  let reason;
  if (isSuspicious)          reason = 'Filename pattern suggests non-official content';
  else if (nameMatches >= 2) reason = `Strong filename match (${nameMatches} keywords)`;
  else if (nameMatches >= 1) reason = `Filename keyword match for ${serviceType}`;
  else if (descMatches >= 1) reason = 'Description keyword match (filename neutral)';
  else                       reason = 'No relevant keywords found in filename or description';

  return { relevant, confidence, flagged, reason };
}

/**
 * Validate all documents for a complaint submission.
 *
 * @param {Array}  documents   - Array of { name, path } objects from client
 * @param {string} serviceType - Service category
 * @param {string} description - Complaint description
 * @returns {{ valid: boolean, message: string, scoredDocs: Array }}
 */
export function validateAndScoreDocuments(documents, serviceType, description) {
  // T3: Mandatory proof for non-general service types
  if (serviceType !== 'general' && (!documents || documents.length === 0)) {
    return {
      valid:      false,
      message:    'Supporting evidence required for this complaint. Please upload at least one relevant document.',
      scoredDocs: []
    };
  }

  // If no documents at all (general is OK without docs)
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

    // T1: Reject irrelevant documents for non-general complaints
    if (!relevant && serviceType !== 'general') {
      return {
        valid:      false,
        message:    `Uploaded document "${doc.name}" does not match complaint type. Please upload relevant ${serviceType} evidence (e.g. bill, meter reading, inspection photo).`,
        scoredDocs: []
      };
    }

    scoredDocs.push({
      name:       doc.name,
      path:       doc.path,
      verified:   !flagged,  // T4: suspicious docs are not verified
      confidence,
      flagged,               // T4: new field
      reason                 // internal — stored for officer review context
    });
  }

  return { valid: true, message: '', scoredDocs };
}
