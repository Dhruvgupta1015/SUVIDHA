/**
 * demoController.js — Demo Mode Engine for SUVIDHA Hackathon Demo
 *
 * Creates instant pre-seeded scenarios for judges.
 * No waiting. Instant live storytelling.
 *
 * POST /api/admin/demo-seed
 */
import Request from '../models/Request.js';
import User from '../models/User.js';
import { getRedis } from '../config/redis.js';
import { logAudit } from '../utils/auditLogger.js';

const broadcastUrgentAlert = (io, payload) => {
  io.emit('urgentAlert', payload);
  try {
    const redis = getRedis();
    redis.lpush('urgent_alerts', JSON.stringify(payload))
      .then(() => redis.ltrim('urgent_alerts', 0, 49))
      .catch(() => {});
  } catch (err) {}
};

const DEMO_SCENARIOS = {
  emergency: {
    serviceType:          'electricity',
    subService:           'Electrical Emergency',
    description:          'Transformer blast near Gandhi Nagar main road. Live wires dangling. Electrocution risk for pedestrians. Immediate action required.',
    priority:             'Critical',
    priorityScore:        12,
    priorityReason:       'AI cumulative score 12/8+ → Critical Emergency. Triggers: "transformer blast" (+4), "electrocution" (+4)',
    isEmergency:          true,
    emergencySource:      'Citizen',
    emergencyTriggeredAt: new Date(),
    status:               'In-Progress',
    assignedDepartment:   'Electricity Department',
    routingReason:        'Strong match: "transformer blast" → Electricity/power infrastructure complaint',
    routingConfidence:    0.98,
    assignedTeam:         'Emergency Response Unit',
    urgentEvents: [{
      message:   '🚨 DEMO: Emergency fast-lane created — Emergency Response Unit alerted.',
      type:      'emergency',
      timestamp: new Date()
    }]
  },
  suspicious: {
    serviceType:        'water',
    subService:         'New Water Connection',
    description:        'Water supply pipeline damaged. No water supply for 3 days in sector 4. Residents affected.',
    priority:           'High',
    priorityScore:      4,
    priorityReason:     'AI cumulative score 4/2–3 → High urgency. Triggers: "no water supply" (+2), "water" (+2)',
    isEmergency:        false,
    status:             'Pending',
    assignedDepartment: 'Water Department',
    routingReason:      'Strong match: "no water supply" → Water supply/pipeline complaint',
    routingConfidence:  0.91,
    assignedTeam:       'Unassigned',
    documents: [{
      name:       'water_bill_scan.jpg',
      path:       'uploads/demo_water_bill.jpg',
      verified:   false,
      confidence: 0.31,  // below 0.50 threshold — triggers suspicious flag
      flagged:    true,
      reason:     'AI evidence confidence 31% — no MIME keyword match, no service match. Document appears unrelated to water complaint.'
    }],
    urgentEvents: [{
      message:   '⚠️ DEMO: Suspicious evidence detected — confidence 31%. Requires officer review.',
      type:      'critical',
      timestamp: new Date()
    }]
  },
  sla_breach: {
    serviceType:        'waste',
    subService:         'Garbage Overflow',
    description:        'Garbage overflow at municipal bin near market area. Overflowing for 5 days causing hygiene hazard.',
    priority:           'High',
    priorityScore:      3,
    priorityReason:     'AI score 3/2–3 → High urgency. Triggers: "garbage overflow" (+2), "overflow" (+1)',
    isEmergency:        false,
    status:             'Pending',
    slaStatus:          'Escalated',
    escalatedAt:        new Date(),
    assignedDepartment: 'Waste Management',
    routingReason:      'Strong match: "garbage overflow" → Waste management/sanitation complaint',
    routingConfidence:  0.93,
    assignedTeam:       'Unassigned',
    // Backdated by 80 hours to simulate SLA breach
    urgentEvents: [{
      message:   '🔴 DEMO: SLA Escalated — complaint is 80h old, no resolution. Immediate action required.',
      type:      'escalation',
      timestamp: new Date()
    }]
  },
  critical_ai: {
    serviceType:        'gas',
    subService:         'Gas Leak Emergency',
    description:        'Strong gas leak smell in residential building. Gas supply pipeline ruptured in basement. Explosion risk. Residents evacuated.',
    priority:           'Critical',
    priorityScore:      9,
    priorityReason:     'AI cumulative score 9/8+ → Critical Emergency. Triggers: "gas leak" (+3), "explosion" (+4), "emergency" (+2)',
    isEmergency:        true,
    emergencySource:    'AI',
    emergencyTriggeredAt: new Date(),
    status:             'In-Progress',
    assignedDepartment: 'Gas Department',
    routingReason:      'Strong match: "gas leak" → Gas supply/pipeline complaint',
    routingConfidence:  0.99,
    assignedTeam:       'Emergency Response Unit',
    urgentEvents: [{
      message:   '🚨 DEMO: AI auto-detected Critical Emergency (score 9). Gas Department + Emergency Response Unit alerted.',
      type:      'emergency',
      timestamp: new Date()
    }]
  },
  reupload: {
    serviceType:        'electricity',
    subService:         'New Connection Meter',
    description:        'Applying for new electricity meter connection for newly constructed house at plot 42, Sector B.',
    priority:           'Standard',
    priorityScore:      0,
    priorityReason:     'No urgency keywords detected — routine complaint',
    isEmergency:        false,
    status:             'In-Progress',
    assignedDepartment: 'Electricity Department',
    routingReason:      'Strong match: "electricity" → Electricity/power infrastructure complaint',
    routingConfidence:  0.90,
    assignedTeam:       'Meter Installation Unit',
    documents: [{
      name:       'electricity_application.pdf',
      path:       'uploads/demo_electricity_app.pdf',
      verified:   false,
      confidence: 0.72,
      flagged:    false,
      reason:     'AI evidence confidence 72% — filename keyword match. Re-upload of clearer utility bill requested by Officer.',
    }],
    urgentEvents: [{
      message:   '🔄 DEMO: Officer requested re-upload of electricity bill (clearer scan required).',
      type:      'info',
      timestamp: new Date()
    }]
  }
};

/**
 * @desc    Seed a demo scenario instantly for hackathon judges
 * @route   POST /api/admin/demo-seed
 * @access  Private (Admin)
 */
export const seedDemoScenario = async (req, res) => {
  try {
    const { scenario } = req.body;

    if (!DEMO_SCENARIOS[scenario]) {
      return res.status(400).json({
        success: false,
        message: `Invalid scenario. Choose: ${Object.keys(DEMO_SCENARIOS).join(', ')}`
      });
    }

    // Find any demo citizen to link to
    let demoCitizen = await User.findOne({ role: 'citizen' });
    if (!demoCitizen) {
      return res.status(400).json({
        success: false,
        message: 'No citizen user found. Please seed base data first.'
      });
    }

    const scenarioData = { ...DEMO_SCENARIOS[scenario] };

    // For SLA breach: backdate createdAt by 80 hours
    const extraFields = {};
    if (scenario === 'sla_breach') {
      extraFields.createdAt = new Date(Date.now() - 80 * 60 * 60 * 1000);
    }

    const request = await Request.create({
      ...scenarioData,
      citizenId: demoCitizen._id,
      ...extraFields
    });

    // SLA breach: update createdAt directly (Mongoose ignores it on create when timestamps:true)
    if (scenario === 'sla_breach') {
      await Request.updateOne({ _id: request._id }, { $set: { createdAt: new Date(Date.now() - 80 * 60 * 60 * 1000) } });
    }

    const populatedRequest = await Request.findById(request._id).populate('citizenId', 'name mobile');

    // Emit urgentAlert for emergency scenarios
    const io = req.app.get('io');
    if (io && (scenarioData.isEmergency || scenarioData.slaStatus === 'Escalated')) {
      broadcastUrgentAlert(io, {
        requestId:   request.requestId,
        priority:    scenarioData.priority,
        isEmergency: scenarioData.isEmergency || false,
        service:     scenarioData.serviceType,
        message:     `🎬 DEMO: ${scenario.replace('_', ' ').toUpperCase()} scenario — ${scenarioData.priorityReason}`,
        time:        new Date().toISOString()
      });
    }

    // -- Phase 5: Audit Trail --
    await logAudit({
      actorId: req.user.id,
      actorRole: 'admin',
      action: 'admin_override',
      targetRequest: request._id,
      ipAddress: req.ip,
      metadata: { scenario, priority: scenarioData.priority }
    });

    return res.status(201).json({
      success:   true,
      message:   `Demo scenario "${scenario}" created successfully!`,
      requestId: request.requestId,
      scenario,
      request:   populatedRequest
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get advanced analytics for admin dashboard
 * @route   GET /api/admin/analytics
 * @access  Private (Admin)
 */
export const getAdvancedAnalytics = async (req, res) => {
  try {
    const [
      priorityDist,
      departmentDist,
      emergencyCount,
      escalatedCount,
      suspiciousCount,
      todayResolved,
      statusDist
    ] = await Promise.all([
      // Priority distribution
      Request.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      // Complaints by department
      Request.aggregate([{ $group: { _id: '$assignedDepartment', count: { $sum: 1 } } }]),
      // Emergency complaints
      Request.countDocuments({ isEmergency: true }),
      // SLA Escalated
      Request.countDocuments({ slaStatus: 'Escalated', status: { $nin: ['Completed', 'Rejected'] } }),
      // Suspicious evidence (flagged documents)
      Request.countDocuments({ 'documents.flagged': true }),
      // Resolved today
      Request.countDocuments({
        status: 'Completed',
        updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      // Status distribution
      Request.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);

    return res.status(200).json({
      success: true,
      analytics: {
        priorityDist,
        departmentDist,
        emergencyCount,
        escalatedCount,
        suspiciousCount,
        todayResolved,
        statusDist
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    System health panel data
 * @route   GET /api/admin/health
 * @access  Private (Admin)
 */
export const getSystemHealth = async (req, res) => {
  try {
    const io = req.app.get('io');
    const connectedSockets = io ? io.engine.clientsCount : 0;

    const [totalPending, totalEmergency, totalEscalated, totalOfficers] = await Promise.all([
      Request.countDocuments({ status: 'Pending' }),
      Request.countDocuments({ isEmergency: true, status: { $nin: ['Completed', 'Rejected'] } }),
      Request.countDocuments({ slaStatus: 'Escalated', status: { $nin: ['Completed', 'Rejected'] } }),
      User.countDocuments({ role: 'officer' })
    ]);

    let adv = {};
    try {
      const port = process.env.PORT || 5000;
      // In Node 18+, fetch is available globally
      const resData = await fetch(`http://127.0.0.1:${port}/health`);
      const body = await resData.json();
      if (body.success) adv = body;
    } catch(e) {}

    return res.status(200).json({
      success: true,
      health: {
        backend:          'online',
        socket:           connectedSockets > 0 ? 'connected' : 'idle',
        socketClients:    connectedSockets,
        db:               adv.dbStatus?.toLowerCase() || 'connected',
        dbLatency:        adv.dbLatency || 0,
        redis:            adv.redisStatus?.toLowerCase() || 'idle',
        redisLatency:     adv.redisLatency || 0,
        cpuPercent:       adv.cpu || 0,
        memPercent:       adv.memory?.percent || 0,
        apiLatency:       adv.avgApiLatency || 0,
        uptime:           Math.floor(process.uptime()),
        pendingComplaints: totalPending,
        activeEmergencies: totalEmergency,
        activeEscalations: totalEscalated,
        officerCount:     totalOfficers,
        timestamp:        new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
