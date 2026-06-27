import express from 'express';
import { createRequest, getRequestById, updateRequestStatus } from '../controllers/requestController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', protect, createRequest);
router.get('/:id', getRequestById);
router.put('/update-status', protect, authorize('admin'), updateRequestStatus);

export default router;
