import Request from '../models/Request.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { getRedis } from '../config/redis.js';

/**
 * @desc    Get dashboard metrics, SLA violations, and department breakdowns
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin role)
 */
export const getDashboardMetrics = async (req, res) => {
  try {
    const redis = getRedis();
    const cacheKey = 'admin:dashboard_metrics';

    // 1. Check Cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    // 2. Calculate status counts
    const total = await Request.countDocuments();
    const pending = await Request.countDocuments({ status: 'Pending' });
    const inProgress = await Request.countDocuments({ status: 'In-Progress' });
    const approved = await Request.countDocuments({ status: 'Approved' });
    const rejected = await Request.countDocuments({ status: 'Rejected' });
    const completed = await Request.countDocuments({ status: 'Completed' });

    // 2. Fetch all requests populated with citizen details
    const allRequests = await Request.find()
      .populate('citizenId', 'name mobile')
      .sort({ createdAt: -1 });

    // 3. Detect SLA violations (requests pending > 48 hours)
    const SLA_LIMIT_MS = 48 * 60 * 60 * 1000; // 48 Hours
    const thresholdDate = new Date(Date.now() - SLA_LIMIT_MS);
    
    const violations = await Request.find({
      status: { $in: ['Pending', 'In-Progress'] },
      createdAt: { $lt: thresholdDate }
    }).populate('citizenId', 'name mobile');

    // 4. Calculate service category breakdown
    const serviceBreakdown = await Request.aggregate([
      { $group: { _id: "$serviceType", count: { $sum: 1 } } }
    ]);

    const responseData = {
      success: true,
      metrics: { total, pending, inProgress, approved, rejected, completed },
      serviceBreakdown,
      slaViolations: violations,
      requests: allRequests
    };

    // 6. Save to cache (15 seconds TTL to balance real-time vs performance)
    await redis.setex(cacheKey, 15, JSON.stringify(responseData));

    return res.status(200).json(responseData);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get list of all departmental officers
 * @route   GET /api/admin/officers
 * @access  Private (Admin role)
 */
export const getOfficers = async (req, res) => {
  try {
    const officers = await User.find({ role: 'officer' }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: officers.length,
      officers
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create a new departmental officer
 * @route   POST /api/admin/officers
 * @access  Private (Admin role)
 */
export const createOfficer = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({ success: false, message: 'Please provide all details (name, email, password, department)' });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'An officer/staff with this email already exists' });
    }

    const officer = await User.create({
      name,
      email,
      password,
      department,
      role: 'officer'
    });

    return res.status(201).json({
      success: true,
      message: 'Officer account created successfully',
      officer: {
        id: officer._id,
        name: officer.name,
        email: officer.email,
        department: officer.department,
        role: officer.role
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete an officer
 * @route   DELETE /api/admin/officers/:id
 * @access  Private (Admin role)
 */
export const deleteOfficer = async (req, res) => {
  try {
    const { id } = req.params;

    const officer = await User.findById(id);

    if (!officer || officer.role !== 'officer') {
      return res.status(404).json({ success: false, message: 'Officer not found' });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Officer account deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get live telemetry logs
 * @route   GET /api/admin/telemetry
 * @access  Private (Admin role)
 */
export const getTelemetryLogs = async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const logPath = path.join(__dirname, '../logs/app.log');

    let logs = [];
    if (fs.existsSync(logPath)) {
      const data = fs.readFileSync(logPath, 'utf8');
      const lines = data.split('\n').filter(Boolean);
      
      // Get last 50 lines
      logs = lines.slice(-50).map((line, idx) => {
        // Parse basic Winston format: [2023-10-27 10:00:00] info: [API] ...
        let type = 'info';
        if (line.includes('error:') || line.includes('critical')) type = 'error';
        if (line.includes('warn:')) type = 'warn';
        if (line.includes('success') || line.includes('successfully')) type = 'success';
        
        return {
          id: Date.now() + idx,
          type,
          time: line.substring(1, 20) || new Date().toLocaleTimeString(),
          text: line
        };
      }).reverse(); // newest first
    } else {
      logs = [{ id: 1, type: 'info', time: new Date().toLocaleTimeString(), text: 'No logs generated yet.' }];
    }

    return res.status(200).json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Global Audit Logs
 * @route   GET /api/admin/audit-logs
 * @access  Private (Admin role)
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { action, actorRole, requestId, limit = 50 } = req.query;
    let query = {};
    
    if (action) query.action = action;
    if (actorRole) query.actorRole = actorRole;
    if (requestId) query.targetRequest = requestId;

    const logs = await AuditLog.find(query)
      .populate('actorId', 'name email role department')
      .populate('targetRequest', 'requestId serviceType subService status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    return res.status(200).json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Governance Metrics
 * @route   GET /api/admin/audit-metrics
 * @access  Private (Admin role)
 */
export const getAuditMetrics = async (req, res) => {
  try {
    const metrics = {
      mostActiveOfficers: [],
      mostEscalated: 0,
      rejectedEvidence: 0,
      emergencyFrequency: 0,
      governanceScore: 100
    };

    // Calculate metrics
    const escalated = await AuditLog.countDocuments({ action: 'sla_escalated' });
    const rejected = await AuditLog.countDocuments({ action: 'evidence_rejected' });
    const emergency = await AuditLog.countDocuments({ action: 'emergency_triggered' });

    metrics.mostEscalated = escalated;
    metrics.rejectedEvidence = rejected;
    metrics.emergencyFrequency = emergency;

    // Aggregate most active officers
    const activeOfficers = await AuditLog.aggregate([
      { $match: { actorRole: 'officer', actorId: { $ne: null } } },
      { $group: { _id: '$actorId', actionsCount: { $sum: 1 } } },
      { $sort: { actionsCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'officer' } },
      { $unwind: '$officer' },
      { $project: { _id: 1, name: '$officer.name', department: '$officer.department', actionsCount: 1 } }
    ]);
    
    metrics.mostActiveOfficers = activeOfficers;

    // Calculate a basic governance score (example formula)
    const totalRequests = await Request.countDocuments();
    const resolvedRequests = await Request.countDocuments({ status: 'Completed' });
    
    let score = 100;
    if (totalRequests > 0) {
      score = 100 - (escalated * 5) - (rejected * 2) - (emergency * 3) + ((resolvedRequests/totalRequests) * 20);
      // Ensure score is between 0 and 100
      score = Math.min(100, Math.max(0, Math.round(score)));
    }
    metrics.governanceScore = score;

    return res.status(200).json({ success: true, metrics });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
