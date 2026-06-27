import express from 'express';
import { createComplaint, getAllComplaints } from '../controllers/complaintController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', protect, createComplaint);
router.get('/all', protect, authorize('admin'), getAllComplaints);

export default router;
