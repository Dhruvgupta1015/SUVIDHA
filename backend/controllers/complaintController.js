import Complaint from '../models/Complaint.js';
import Request from '../models/Request.js';

/**
 * @desc    Log specific complaint details
 * @route   POST /complaints/create
 * @access  Private
 */
export const createComplaint = async (req, res) => {
  try {
    const { requestId, complaintType, description, evidenceFiles, priority } = req.body;

    if (!requestId || !complaintType || !description) {
      return res.status(400).json({ success: false, message: 'Request ID, type, and description are mandatory fields' });
    }

    const complaint = await Complaint.create({
      requestId,
      complaintType,
      description,
      evidenceFiles: evidenceFiles || [],
      priority: priority || 'Standard'
    });

    return res.status(201).json({
      success: true,
      message: 'Complaint details logged successfully',
      complaint
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Fetch all complaint files with parent ticket statuses
 * @route   GET /complaints/all
 * @access  Private (Admin role)
 */
export const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate({
        path: 'requestId',
        populate: { path: 'citizenId', select: 'name mobile' }
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
export default { createComplaint, getAllComplaints };
