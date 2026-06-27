import Request from '../models/Request.js';
import User from '../models/User.js';

/**
 * @desc    Get dashboard metrics, SLA violations, and department breakdowns
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin role)
 */
export const getDashboardMetrics = async (req, res) => {
  try {
    // 1. Calculate status counts
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

    return res.status(200).json({
      success: true,
      metrics: {
        total,
        pending,
        inProgress,
        approved,
        rejected,
        completed
      },
      serviceBreakdown,
      slaViolations: violations,
      requests: allRequests
    });
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
