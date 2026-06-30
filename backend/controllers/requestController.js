import mongoose from 'mongoose';
import Request from '../models/Request.js';
import User from '../models/User.js';
import { validateAndScoreDocuments, rescoreDocument } from '../utils/evidenceValidator.js';
import { detectPriority } from '../utils/priorityEngine.js';
import { routeComplaint } from '../utils/routingEngine.js';

/**
 * @desc    Create new civic request or complaint
 * @route   POST /api/requests/create
 * @access  Private (Citizen)
 */
export const createRequest = async (req, res) => {
  try {
    const { serviceType, subService, description, documents } = req.body;
    const citizenId = req.user.id; // from protect middleware

    // ── Input validation ─────────────────────────────────────────────────
    const validServiceTypes = ['electricity', 'water', 'gas', 'waste', 'general'];

    if (!serviceType || !validServiceTypes.includes(serviceType)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing serviceType. Must be one of: electricity, water, gas, waste, general.' });
    }
    if (!subService || typeof subService !== 'string' || subService.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Sub-service category is required.' });
    }
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Description must be at least 10 characters.' });
    }

    // ── T6: Duplicate complaint detection (same citizen, 24h window) ─────────
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

    // ── T1/T2/T3/T4: Evidence validation + confidence scoring ───────────
    const { valid, message, scoredDocs } = validateAndScoreDocuments(
      documents || [],
      serviceType,
      description
    );

    if (!valid) {
      return res.status(400).json({ success: false, message });
    }

    // ── Cat3 T1: AI Priority Engine — cumulative scoring ──────────────────────
    const { priority, priorityScore, priorityReason, isEmergency } = detectPriority(description, subService);

    // ── Cat3 T3: Smart Department Routing with confidence ────────────────────
    const { department: assignedDepartment, routingReason, routingConfidence } = routeComplaint(serviceType, subService, description);

    // ── T5: Build initial urgentEvents entry if Critical/Emergency ─────────
    const urgentEvents = [];
    if (priority === 'Critical' || isEmergency) {
      urgentEvents.push({
        message:   `${isEmergency ? '🚨 Emergency' : '⚡ Critical'} complaint created: ${subService} (${serviceType}). Score: ${priorityScore}.`,
        type:      isEmergency ? 'emergency' : 'critical',
        timestamp: new Date()
      });
    }

    const request = await Request.create({
      citizenId,
      serviceType,
      subService,
      description,
      priority,
      priorityScore,
      priorityReason,
      isEmergency,
      emergencySource:      isEmergency ? 'AI' : null,     // T4: AI auto-detected
      emergencyTriggeredAt: isEmergency ? new Date() : null,
      assignedDepartment,
      routingReason,
      routingConfidence,
      documents: scoredDocs,
      urgentEvents
    });

    const populatedRequest = await Request.findById(request._id).populate('citizenId', 'name mobile');

    // ── Socket: emit newRequest + urgentAlert for Critical/Emergency ──────
    const io = req.app.get('io');
    if (io) {
      io.emit('newRequest', {
        id:          request.requestId,
        citizenName: populatedRequest.citizenId.name,
        service:     serviceType,
        subService,
        status:      request.status,
        priority:    request.priority,
        isEmergency: request.isEmergency,
        time:        'Just now'
      });

      // Cat3 T8: Real-time urgency alert for officer/admin dashboards
      if (priority === 'Critical' || isEmergency) {
        io.emit('urgentAlert', {
          requestId:   request.requestId,
          priority:    request.priority,
          isEmergency: request.isEmergency,
          service:     serviceType,
          message:     `${isEmergency ? '🚨 Emergency' : '⚡ Critical'} complaint received: ${subService} (${serviceType})`,
          time:        new Date().toISOString()
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Civic request registered successfully',
      requestId:         request.requestId,
      priority,
      priorityScore,
      priorityReason,
      isEmergency,
      routingConfidence,
      request:           populatedRequest
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Emergency fast-lane complaint — bypasses normal queue
 * @route   POST /api/requests/emergency
 * @access  Private (Citizen)
 */
export const createEmergencyRequest = async (req, res) => {
  try {
    const { serviceType, subService, description, emergencyType } = req.body;
    const citizenId = req.user.id;

    const validServiceTypes = ['electricity', 'water', 'gas', 'waste', 'general'];
    if (!serviceType || !validServiceTypes.includes(serviceType)) {
      return res.status(400).json({ success: false, message: 'Invalid serviceType.' });
    }
    if (!description || description.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Description is required.' });
    }

    // Smart routing with confidence
    const { department: assignedDepartment, routingReason, routingConfidence } = routeComplaint(serviceType, subService || emergencyType, description);

    // T5: Initial urgent event
    const urgentEvents = [{
      message:   `🚨 EMERGENCY fast-lane created: ${emergencyType || subService} — Emergency Response Unit alerted.`,
      type:      'emergency',
      timestamp: new Date()
    }];

    const request = await Request.create({
      citizenId,
      serviceType,
      subService:           subService || emergencyType || 'Emergency Complaint',
      description:          description.trim(),
      priority:             'Critical',
      priorityScore:        12,   // max score for explicit emergency
      priorityReason:       `Emergency fast-lane: ${emergencyType || 'Emergency reported by citizen'}`,
      isEmergency:          true,
      emergencySource:      'Citizen',     // T4: citizen pressed Emergency button
      emergencyTriggeredBy: citizenId,     // T4: citizen user ID
      emergencyTriggeredAt: new Date(),   // T4: timestamp
      status:               'In-Progress',
      assignedDepartment,
      routingReason,
      routingConfidence,
      assignedTeam:         'Emergency Response Unit',
      urgentEvents
    });

    const populatedRequest = await Request.findById(request._id).populate('citizenId', 'name mobile');

    const io = req.app.get('io');
    if (io) {
      io.emit('urgentAlert', {
        requestId:   request.requestId,
        priority:    'Critical',
        isEmergency: true,
        service:     serviceType,
        message:     `🚨 EMERGENCY: ${emergencyType || subService} reported — ${assignedDepartment} alerted`,
        time:        new Date().toISOString()
      });
      io.emit('newRequest', {
        id:          request.requestId,
        citizenName: populatedRequest.citizenId.name,
        service:     serviceType,
        subService:  request.subService,
        status:      'In-Progress',
        priority:    'Critical',
        isEmergency: true,
        time:        'Just now'
      });
    }

    return res.status(201).json({
      success:          true,
      message:          'Emergency complaint registered. Emergency Response Unit has been alerted.',
      requestId:        request.requestId,
      priority:         'Critical',
      isEmergency:      true,
      routingConfidence,
      request:          populatedRequest
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Auto-escalation check — called by a periodic job or admin trigger
 *          Finds requests at 72h+ that haven't been escalated yet and fires urgentAlert.
 * @route   POST /api/requests/check-escalations
 * @access  Private (Admin only)
 */
export const checkAndEscalateSla = async (req, res) => {
  try {
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

    // Find unresolved requests older than 72h that have NOT been escalated yet
    const escalationCandidates = await Request.find({
      createdAt:   { $lte: seventyTwoHoursAgo },
      status:      { $nin: ['Completed', 'Rejected'] },
      escalatedAt: null                          // dedup guard — only escalate once
    }).populate('citizenId', 'name mobile');

    if (escalationCandidates.length === 0) {
      return res.status(200).json({ success: true, message: 'No new escalations required.', escalated: 0 });
    }

    const io = req.app.get('io');
    const escalatedIds = [];

    for (const request of escalationCandidates) {
      const ageHours = Math.floor((Date.now() - new Date(request.createdAt).getTime()) / (1000 * 60 * 60));

      // Push escalation event into urgentEvents (T5)
      request.urgentEvents.push({
        message:   `🔴 SLA Escalated: ${request.requestId} is ${ageHours}h old — ${request.assignedDepartment} must act immediately.`,
        type:      'escalation',
        timestamp: new Date()
      });

      // Set escalatedAt to prevent future duplicate escalations (T3)
      request.slaStatus   = 'Escalated';
      request.escalatedAt = new Date();

      await request.save();

      // Broadcast urgentAlert (T8)
      if (io) {
        io.emit('urgentAlert', {
          requestId:   request.requestId,
          priority:    request.priority,
          isEmergency: request.isEmergency,
          service:     request.serviceType,
          message:     `🔴 SLA ESCALATED: ${request.requestId} — ${ageHours}h old, no resolution. Immediate action required.`,
          time:        new Date().toISOString()
        });
      }

      escalatedIds.push(request.requestId);
    }

    return res.status(200).json({
      success:   true,
      message:   `${escalatedIds.length} request(s) auto-escalated.`,
      escalated: escalatedIds.length,
      ids:       escalatedIds
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
