import Request from '../models/Request.js';
import User from '../models/User.js';

/**
 * @desc    Create new civic request or complaint
 * @route   POST /api/requests/create
 * @access  Private (Citizen)
 */
export const createRequest = async (req, res) => {
  try {
    const { serviceType, subService, description, documents, priority } = req.body;
    const citizenId = req.user.id; // from protect middleware

    // Input validation
    const validServiceTypes = ['electricity', 'water', 'gas', 'waste', 'general'];
    const validPriorities   = ['Standard', 'High', 'Critical'];

    if (!serviceType || !validServiceTypes.includes(serviceType)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing serviceType. Must be one of: electricity, water, gas, waste, general.' });
    }
    if (!subService || typeof subService !== 'string' || subService.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Sub-service category is required.' });
    }
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Description must be at least 10 characters.' });
    }
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority level. Must be: Standard, High, or Critical.' });
    }

    // Map serviceType to realistic department
    let assignedDepartment = 'General Administration';
    if (serviceType === 'electricity') assignedDepartment = 'Electricity Department';
    else if (serviceType === 'water') assignedDepartment = 'Water Department';
    else if (serviceType === 'gas') assignedDepartment = 'Gas Department';
    else if (serviceType === 'waste') assignedDepartment = 'Waste Management';

    const request = await Request.create({
      citizenId,
      serviceType,
      subService,
      description,
      priority: priority || 'Standard',
      assignedDepartment,
      documents: documents || []
    });

    const populatedRequest = await Request.findById(request._id).populate('citizenId', 'name mobile');

    // Emit Socket update for dashboards
    const io = req.app.get('io');
    if (io) {
      io.emit('newRequest', {
        id: request.requestId,
        citizenName: populatedRequest.citizenId.name,
        service: serviceType,
        subService,
        status: request.status,
        priority: request.priority,
        time: "Just now"
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Civic request registered successfully',
      requestId: request.requestId,
      request: populatedRequest
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get request details by tracking reference ID or ObjectId
 * @route   GET /api/requests/:id
 * @access  Public
 */
export const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    let query = {};
    if (id.startsWith('REQ-')) {
      query = { requestId: id.toUpperCase() };
    } else {
      query = { _id: id };
    }

    const request = await Request.findOne(query).populate('citizenId', 'name mobile aadhaar');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request reference not found' });
    }

    return res.status(200).json({
      success: true,
      request
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get requests filed by the logged-in citizen
 * @route   GET /api/requests/my-requests
 * @access  Private (Citizen)
 */
export const getCitizenRequests = async (req, res) => {
  try {
    const citizenId = req.user.id;
    const requests = await Request.find({ citizenId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get requests assigned to the staff's department (or all for admin)
 * @route   GET /api/requests/department
 * @access  Private (Officer/Admin)
 */
export const getDepartmentRequests = async (req, res) => {
  try {
    const staffId = req.user.id;
    const staff = await User.findById(staffId);

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    let query = {};
    if (staff.role === 'officer') {
      // Filter by officer's department
      query = { assignedDepartment: staff.department };
    } // For admin, query remains empty {} to fetch all requests

    const requests = await Request.find(query)
      .populate('citizenId', 'name mobile')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update request status, assign team, add remarks
 * @route   PUT /api/requests/:id/action
 * @access  Private (Officer/Admin)
 */
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTeam, remarks, assignedDepartment } = req.body;

    const request = await Request.findOne({
      $or: [{ requestId: id.toUpperCase() }, { _id: id }]
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Verify staff has access (Admin has global access, officer matches department)
    const staff = await User.findById(req.user.id);
    if (staff.role === 'officer' && request.assignedDepartment !== staff.department) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify tickets outside your department' });
    }

    // Validate status if provided
    const validStatuses = ['Pending', 'In-Progress', 'Approved', 'Rejected', 'Completed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    if (status) request.status = status;
    if (assignedTeam && typeof assignedTeam === 'string') request.assignedTeam = assignedTeam.trim();
    if (remarks !== undefined && typeof remarks === 'string') request.remarks = remarks.trim();
    if (assignedDepartment && staff.role === 'admin') {
      // Only admin can re-assign departments
      request.assignedDepartment = assignedDepartment;
    }

    await request.save();

    // Emit live WebSocket update
    const io = req.app.get('io');
    if (io) {
      io.emit('statusUpdate', {
        requestId: request.requestId,
        status: request.status,
        assignedTeam: request.assignedTeam,
        remarks: request.remarks,
        department: request.assignedDepartment
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Request ticket updated successfully',
      request
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
