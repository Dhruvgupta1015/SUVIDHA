import Request from '../models/Request.js';
import Complaint from '../models/Complaint.js';

/**
 * @desc    Create new civic request and bind details
 * @route   POST /requests/create
 * @access  Private
 */
export const createRequest = async (req, res) => {
  try {
    const { serviceType, subService, description, documents, priority } = req.body;
    const citizenId = req.user.id; // from JWT middleware protect

    if (!serviceType || !description) {
      return res.status(400).json({ success: false, message: 'Service type and description are required' });
    }

    // 1. Create parent request
    const request = await Request.create({
      citizenId,
      serviceType,
      documents: documents || []
    });

    // 2. Create child complaint details mapping
    const complaint = await Complaint.create({
      requestId: request._id,
      complaintType: subService || 'General Request',
      description,
      priority: priority || 'Standard'
    });

    // Populate user metadata
    const populatedRequest = await Request.findById(request._id).populate('citizenId', 'name mobile');

    // 3. Emit real-time socket updates for Admin Dashboard
    const io = req.app.get('io');
    if (io) {
      io.emit('newRequest', {
        id: request.requestId,
        citizenName: populatedRequest.citizenId.name,
        service: serviceType,
        status: request.status,
        time: "Just now"
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Civic request registered successfully',
      requestId: request.requestId,
      request: populatedRequest,
      complaint
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get request details by tracking reference ID or ObjectId
 * @route   GET /requests/:id
 * @access  Public
 */
export const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    // Search by string requestId (e.g. REQ-2026-XXXX) or by Mongoose _id
    let query = {};
    if (id.startsWith('REQ-')) {
      query = { requestId: id.toUpperCase() };
    } else {
      query = { _id: id };
    }

    const request = await Request.findOne(query).populate('citizenId', 'name mobile');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request reference not found' });
    }

    // Populate complaint detail specs
    const complaint = await Complaint.findOne({ requestId: request._id });

    return res.status(200).json({
      success: true,
      request,
      complaint: complaint || null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update request status (Admin actions)
 * @route   PUT /requests/update-status
 * @access  Private (Admin role)
 */
export const updateRequestStatus = async (req, res) => {
  try {
    const { id, status, assignedDepartment } = req.body;

    if (!id || !status) {
      return res.status(400).json({ success: false, message: 'Request ID and status parameters are mandatory' });
    }

    let query = {};
    if (id.startsWith('REQ-')) {
      query = { requestId: id.toUpperCase() };
    } else {
      query = { _id: id };
    }

    const request = await Request.findOne(query);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request ID not found' });
    }

    // Update fields
    request.status = status;
    if (assignedDepartment) {
      request.assignedDepartment = assignedDepartment;
    }

    await request.save();

    // Emit real-time Socket.io updates for active kiosks
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
      message: `Request status updated to ${status}`,
      request
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
