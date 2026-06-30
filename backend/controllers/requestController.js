import mongoose from 'mongoose';
import Request from '../models/Request.js';
import User from '../models/User.js';
import { validateAndScoreDocuments, rescoreDocument } from '../utils/evidenceValidator.js';

/**
 * @desc    Create new civic request or complaint
 * @route   POST /api/requests/create
 * @access  Private (Citizen)
 */
export const createRequest = async (req, res) => {
  try {
    const { serviceType, subService, description, documents, priority } = req.body;
    const citizenId = req.user.id; // from protect middleware

    // ── Input validation ──────────────────────────────────────────────────────
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

    // ── T6: Duplicate complaint detection (same citizen, 24h window) ──────────
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const duplicate = await Request.findOne({
      citizenId,
      serviceType,
      subService: subService.trim(),
      description: description.trim(),
      createdAt: { $gte: oneDayAgo }
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `Similar complaint already exists (${duplicate.requestId}). Please track your existing request before filing again.`
      });
    }

    // ── T1 / T2 / T3 / T4: Evidence validation + confidence scoring ───────────
    const { valid, message, scoredDocs } = validateAndScoreDocuments(
      documents || [],
      serviceType,
      description
    );

    if (!valid) {
      return res.status(400).json({ success: false, message });
    }

    // ── Map serviceType to department ─────────────────────────────────────────
    let assignedDepartment = 'General Administration';
    if (serviceType === 'electricity') assignedDepartment = 'Electricity Department';
    else if (serviceType === 'water')  assignedDepartment = 'Water Department';
    else if (serviceType === 'gas')    assignedDepartment = 'Gas Department';
    else if (serviceType === 'waste')  assignedDepartment = 'Waste Management';

    const request = await Request.create({
      citizenId,
      serviceType,
      subService,
      description,
      priority: priority || 'Standard',
      assignedDepartment,
      documents: scoredDocs  // already scored + flagged by evidenceValidator
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

    // Safe ID resolution — avoids CastError when id is a REQ- string
    let query = null;
    if (id.startsWith('REQ-')) {
      query = { requestId: id.toUpperCase() };
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      return res.status(400).json({ success: false, message: 'Invalid request ID format' });
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

    // Safe ID resolution — avoids CastError when id is a REQ- string
    let query = null;
    if (id.startsWith('REQ-')) {
      query = { requestId: id.toUpperCase() };
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format'
      });
    }

    const request = await Request.findOne(query);

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

/**
 * @desc    Officer manual evidence override (Approve / Reject / Request Re-upload)
 * @route   PUT /api/requests/:id/evidence-action
 * @access  Private (Officer / Admin)
 */
export const evidenceAction = async (req, res) => {
  try {
    const { id }                       = req.params;
    const { docIndex, action }         = req.body;
    const officerId                    = req.user.id;

    const validActions = ['approve', 'reject', 'request-reupload'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action. Use: approve, reject, or request-reupload.' });
    }

    // Safe ID resolution
    let query = null;
    if (typeof id === 'string' && id.startsWith('REQ-')) {
      query = { requestId: id.toUpperCase() };
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      return res.status(400).json({ success: false, message: 'Invalid request ID format.' });
    }

    const request = await Request.findOne(query);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // Validate docIndex
    const idx = parseInt(docIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= request.documents.length) {
      return res.status(400).json({ success: false, message: 'Invalid document index.' });
    }

    const doc = request.documents[idx];

    // Apply officer decision
    if (action === 'approve') {
      doc.verified    = true;
      doc.flagged     = false;
      doc.reason      = 'Approved by Officer';
    } else if (action === 'reject') {
      doc.verified    = false;
      doc.flagged     = true;
      doc.reason      = 'Rejected by Officer';
    } else if (action === 'request-reupload') {
      doc.verified    = false;
      doc.flagged     = true;
      doc.reason      = 'Re-upload requested by Officer';
    }

    // Audit trail
    doc.reviewedBy  = officerId;
    doc.reviewedAt  = new Date();

    await request.save();

    return res.status(200).json({
      success: true,
      message: `Evidence ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 're-upload requested'} successfully.`,
      document: doc
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Citizen re-uploads evidence for a flagged / re-upload-requested document
 * @route   PUT /api/requests/:id/reupload
 * @access  Private (Citizen — own complaint only)
 */
export const reuploadeEvidence = async (req, res) => {
  try {
    const { id }              = req.params;
    const { docIndex, name, path: filePath } = req.body;
    const citizenId           = req.user.id;

    if (!name || !filePath) {
      return res.status(400).json({ success: false, message: 'Document name and path are required.' });
    }

    // Safe ID resolution
    let query = null;
    if (typeof id === 'string' && id.startsWith('REQ-')) {
      query = { requestId: id.toUpperCase() };
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      return res.status(400).json({ success: false, message: 'Invalid request ID format.' });
    }

    const request = await Request.findOne(query);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // Ownership check — only the citizen who filed the request can re-upload
    if (String(request.citizenId) !== String(citizenId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this request.' });
    }

    const idx = parseInt(docIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= request.documents.length) {
      return res.status(400).json({ success: false, message: 'Invalid document index.' });
    }

    const existingDoc = request.documents[idx];

    // Only allow re-upload if flagged or explicitly requested
    if (!existingDoc.flagged && existingDoc.reason !== 'Re-upload requested by Officer') {
      return res.status(400).json({
        success: false,
        message: 'Re-upload is only allowed for flagged or officer-requested documents.'
      });
    }

    // Re-score with deterministic engine
    const scored = rescoreDocument(name, filePath, request.serviceType, request.description);

    // Replace document in-place — preserve ticket lifecycle
    request.documents[idx] = {
      ...existingDoc.toObject(),
      name:        scored.name,
      path:        scored.path,
      verified:    scored.verified,
      confidence:  scored.confidence,
      flagged:     scored.flagged,
      reason:      scored.reason,
      reviewedBy:  null,   // reset — needs officer re-review
      reviewedAt:  null
    };

    await request.save();

    return res.status(200).json({
      success:  true,
      message:  'Evidence re-uploaded and re-scored successfully.',
      document: request.documents[idx],
      request
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
