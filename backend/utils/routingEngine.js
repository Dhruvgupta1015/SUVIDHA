/**
 * routingEngine.js — Smart Department Routing Engine with Confidence for SUVIDHA
 *
 * Upgrade: Each keyword has a tier (strong/moderate) that determines
 * the routing confidence percentage.
 *
 * Confidence tiers:
 *   Strong match  → 90–99%
 *   Moderate match → 70–89%
 *   Fallback       → 50–69%
 *
 * Returns: { department, routingReason, routingConfidence }
 */

// ─── Department routing rules ────────────────────────────────────────────────
const ROUTING_RULES = [
  // ── Electricity ─────────────────────────────────────────────────────────────
  {
    department: 'Electricity Department',
    strongKeywords: [
      'electrocution', 'transformer blast', 'short circuit', 'live wire',
      'exposed wire', 'electric shock', 'substation', 'high voltage',
      'electricity', 'streetlight', 'street light', 'bescom'
    ],
    moderateKeywords: [
      'electric', 'power', 'voltage', 'wire', 'wiring', 'meter', 'connection',
      'grid', 'fuse', 'circuit', 'outage', 'blackout', 'phase',
      'no electricity', 'electricity gone', 'power outage'
    ],
    reason: 'Electricity / power infrastructure complaint'
  },
  // ── Gas ─────────────────────────────────────────────────────────────────────
  {
    department: 'Gas Department',
    strongKeywords: [
      'gas leak', 'gas explosion', 'gas smell', 'lpg', 'png', 'gail',
      'gas pipe', 'gas meter', 'gas connection', 'gas supply', 'gas cylinder',
      'cylinder', 'gas'
    ],
    moderateKeywords: [
      'burner', 'valve', 'odour', 'smell', 'pressure', 'gas line'
    ],
    reason: 'Gas supply / pipeline infrastructure complaint'
  },
  // ── Water ───────────────────────────────────────────────────────────────────
  {
    department: 'Water Department',
    strongKeywords: [
      'water leakage', 'burst main', 'no water supply', 'water cut',
      'dirty water', 'water contamination', 'bwssb', 'waterlogging',
      'sewage overflow', 'pipeline burst', 'broken pipeline', 'water'
    ],
    moderateKeywords: [
      'leakage', 'pipe', 'pipeline', 'tap', 'reservoir', 'tank', 'supply',
      'sewage', 'drain', 'contamination', 'plumb', 'flood', 'overflow',
      'drainage', 'no water', 'water supply', 'low pressure'
    ],
    reason: 'Water supply / pipeline infrastructure complaint'
  },
  // ── Waste ───────────────────────────────────────────────────────────────────
  {
    department: 'Waste Management',
    strongKeywords: [
      'garbage overflow', 'garbage dump', 'uncollected garbage', 'bbmp',
      'solid waste', 'sewage smell', 'garbage', 'waste', 'rubbish'
    ],
    moderateKeywords: [
      'trash', 'dustbin', 'bin', 'litter', 'dump', 'debris', 'sanitation',
      'sweeping', 'cleaning', 'uncollected'
    ],
    reason: 'Waste management / sanitation complaint'
  }
];

/**
 * Route a complaint to the best department with confidence score.
 *
 * @param {string} serviceType  - Selected service category
 * @param {string} subService   - Sub-service label
 * @param {string} description  - Complaint description
 * @returns {{
 *   department: string,
 *   routingReason: string,
 *   routingConfidence: number  // 0.0 – 1.0
 * }}
 */
export function routeComplaint(serviceType = 'general', subService = '', description = '') {
  const text = `${subService} ${description}`.toLowerCase();

  // ── Pass 1: Strong keyword match → high confidence ──────────────────────────
  for (const rule of ROUTING_RULES) {
    for (const kw of rule.strongKeywords) {
      if (text.includes(kw)) {
        // Strong matches: 90–99% — deterministically based on keyword position
        const base = 90;
        const bonus = Math.min(9, rule.strongKeywords.indexOf(kw)); // 0–9 bonus
        const confidence = (base + bonus) / 100;
        return {
          department:         rule.department,
          routingReason:      `Strong match: "${kw}" → ${rule.reason}`,
          routingConfidence:  Math.min(0.99, confidence)
        };
      }
    }
  }

  // ── Pass 2: Moderate keyword match → medium confidence ──────────────────────
  for (const rule of ROUTING_RULES) {
    for (const kw of rule.moderateKeywords) {
      if (text.includes(kw)) {
        // Moderate matches: 70–89%
        const base = 70;
        const bonus = Math.min(19, rule.moderateKeywords.indexOf(kw)); // 0–19 bonus
        const confidence = (base + bonus) / 100;
        return {
          department:         rule.department,
          routingReason:      `Moderate match: "${kw}" → ${rule.reason}`,
          routingConfidence:  Math.min(0.89, confidence)
        };
      }
    }
  }

  // ── Fallback: serviceType-based routing → low confidence ────────────────────
  const serviceMap = {
    electricity: { department: 'Electricity Department', routingReason: 'Routed by service category: electricity', routingConfidence: 0.65 },
    water:       { department: 'Water Department',        routingReason: 'Routed by service category: water',       routingConfidence: 0.65 },
    gas:         { department: 'Gas Department',          routingReason: 'Routed by service category: gas',         routingConfidence: 0.65 },
    waste:       { department: 'Waste Management',        routingReason: 'Routed by service category: waste',       routingConfidence: 0.65 },
    general:     { department: 'General Administration',  routingReason: 'General complaint — default routing',     routingConfidence: 0.50 }
  };

  return serviceMap[serviceType] || {
    department:        'General Administration',
    routingReason:     'Default routing applied — no keyword or category match',
    routingConfidence: 0.50
  };
}
