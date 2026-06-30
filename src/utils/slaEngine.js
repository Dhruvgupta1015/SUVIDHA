/**
 * slaEngine.js — SLA Breach Detection Utility for SUVIDHA
 *
 * Computes SLA status based on complaint age:
 *   < 24h  → Safe
 *   24-48h → Warning
 *   48-72h → Critical
 *   > 72h  → Escalated
 *
 * Used by: frontend (pure JS utility, computed client-side from createdAt)
 */

/**
 * Compute SLA status from a createdAt ISO date string.
 * @param {string|Date} createdAt
 * @returns {{ slaStatus: string, ageHours: number }}
 */
export function computeSlaStatus(createdAt) {
  const ageMs    = Date.now() - new Date(createdAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  let slaStatus;
  if (ageHours < 24)       slaStatus = 'Safe';
  else if (ageHours < 48)  slaStatus = 'Warning';
  else if (ageHours < 72)  slaStatus = 'Critical';
  else                     slaStatus = 'Escalated';

  return { slaStatus, ageHours: Math.round(ageHours * 10) / 10 };
}

/**
 * SLA order weight for sorting (highest = most urgent).
 */
export const SLA_ORDER = { Escalated: 0, Critical: 1, Warning: 2, Safe: 3 };

/**
 * Priority order weight for sorting (highest = most urgent).
 */
export const PRIORITY_ORDER = { Critical: 0, High: 1, Standard: 2 };

/**
 * Predictive queue rank comparator (T5).
 * Sort by: 1) priority, 2) slaStatus, 3) createdAt (oldest first).
 */
export function queueComparator(a, b) {
  const pa = PRIORITY_ORDER[a.priority]  ?? 2;
  const pb = PRIORITY_ORDER[b.priority]  ?? 2;
  if (pa !== pb) return pa - pb;

  const { slaStatus: sa } = computeSlaStatus(a.createdAt);
  const { slaStatus: sb } = computeSlaStatus(b.createdAt);
  const oa = SLA_ORDER[sa] ?? 3;
  const ob = SLA_ORDER[sb] ?? 3;
  if (oa !== ob) return oa - ob;

  return new Date(a.createdAt) - new Date(b.createdAt);
}
