/**
 * routingEngine.js — Smart Department Routing Engine for SUVIDHA
 *
 * Analyses serviceType + subService + description keywords to intelligently
 * route each complaint to the most relevant department.
 *
 * No external APIs — pure deterministic text analysis.
 *
 * Returns: { department, routingReason }
 */

// ─── Department routing rules (ordered by specificity) ────────────────────────
const ROUTING_RULES = [
  // ── Electricity ───────────────────────────────────────────────────────────
  {
    department: 'Electricity Department',
    keywords: [
      'streetlight', 'street light', 'electricity', 'electric', 'power',
      'transformer', 'voltage', 'wire', 'wiring', 'meter', 'connection',
      'substation', 'grid', 'fuse', 'circuit', 'outage', 'blackout',
      'bescom', 'electrocution', 'short circuit', 'live wire', 'phase'
    ],
    reason: 'Electricity/power infrastructure complaint'
  },
  // ── Water ─────────────────────────────────────────────────────────────────
  {
    department: 'Water Department',
    keywords: [
      'water', 'leakage', 'pipe', 'pipeline', 'bwssb', 'tap', 'reservoir',
      'tank', 'supply', 'sewage', 'drain', 'contamination', 'plumb',
      'burst main', 'water cut', 'no water', 'dirty water', 'flood',
      'waterlogging', 'overflow', 'drainage'
    ],
    reason: 'Water supply / pipeline infrastructure complaint'
  },
  // ── Gas ───────────────────────────────────────────────────────────────────
  {
    department: 'Gas Department',
    keywords: [
      'gas', 'cylinder', 'lpg', 'png', 'gail', 'gas leak', 'gas smell',
      'gas pipe', 'gas meter', 'burner', 'valve', 'pressure', 'odour',
      'smell', 'gas connection', 'gas supply'
    ],
    reason: 'Gas supply / pipeline infrastructure complaint'
  },
  // ── Waste ─────────────────────────────────────────────────────────────────
  {
    department: 'Waste Management',
    keywords: [
      'garbage', 'waste', 'trash', 'bbmp', 'dustbin', 'bin', 'litter',
      'dump', 'debris', 'sanitation', 'solid waste', 'sweeping', 'cleaning',
      'garbage overflow', 'uncollected', 'rubbish', 'sewage smell'
    ],
    reason: 'Waste management / sanitation complaint'
  }
];

/**
 * Route a complaint to the best department.
 *
 * @param {string} serviceType  - Selected service category
 * @param {string} subService   - Sub-service label
 * @param {string} description  - Complaint description
 * @returns {{ department: string, routingReason: string }}
 */
export function routeComplaint(serviceType = 'general', subService = '', description = '') {
  const text = `${subService} ${description}`.toLowerCase();

  // ── First: try keyword-based smart routing ─────────────────────────────────
  for (const rule of ROUTING_RULES) {
    for (const kw of rule.keywords) {
      if (text.includes(kw)) {
        return {
          department:    rule.department,
          routingReason: `Smart route via keyword "${kw}" → ${rule.reason}`
        };
      }
    }
  }

  // ── Fallback: use serviceType mapping ─────────────────────────────────────
  const serviceMap = {
    electricity: { department: 'Electricity Department', routingReason: 'Routed by service category: electricity' },
    water:       { department: 'Water Department',        routingReason: 'Routed by service category: water' },
    gas:         { department: 'Gas Department',          routingReason: 'Routed by service category: gas' },
    waste:       { department: 'Waste Management',        routingReason: 'Routed by service category: waste' },
    general:     { department: 'General Administration',  routingReason: 'General complaint — default routing' }
  };

  return serviceMap[serviceType] || { department: 'General Administration', routingReason: 'Default routing applied' };
}
