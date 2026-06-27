import Request from '../models/Request.js';
import Complaint from '../models/Complaint.js';

/**
 * @desc    Get dashboard metrics, SLA violations, and kiosk analytics
 * @route   GET /admin/dashboard
 * @access  Private (Admin role)
 */
export const getDashboardMetrics = async (req, res) => {
  try {
    // 1. Calculate status counts
    const total = await Request.countDocuments();
    const pending = await Request.countDocuments({ status: { $in: ['Pending', 'In-Progress'] } });
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
 * @desc    Approve request ticket
 * @route   PUT /admin/approve
 * @access  Private (Admin role)
 */
export const approveRequest = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Please specify the request ID' });
    }

    const request = await Request.findOne({
      $or: [{ requestId: id.toUpperCase() }, { _id: id }]
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    request.status = 'Approved';
    request.assignedDepartment = 'Department Processing Wing';
    await request.save();

    // Emit Socket update
    const io = req.app.get('io');
    if (io) {
      io.emit('statusUpdate', {
        requestId: request.requestId,
        status: request.status,
        department: request.assignedDepartment
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Request ticket approved successfully',
      request
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Reject request ticket
 * @route   PUT /admin/reject
 * @access  Private (Admin role)
 */
export const rejectRequest = async (req, res) => {
  try {
    const { id, reason } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Please specify the request ID' });
    }

    const request = await Request.findOne({
      $or: [{ requestId: id.toUpperCase() }, { _id: id }]
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    request.status = 'Rejected';
    request.assignedDepartment = `Closed - Reason: ${reason || 'Incomplete Documentation'}`;
    await request.save();

    // Emit Socket update
    const io = req.app.get('io');
    if (io) {
      io.emit('statusUpdate', {
        requestId: request.requestId,
        status: request.status,
        department: request.assignedDepartment
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Request ticket rejected',
      request
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
