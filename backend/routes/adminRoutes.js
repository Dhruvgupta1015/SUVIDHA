import express from 'express';
import { getDashboardMetrics, approveRequest, rejectRequest } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply admin protection to all routes below
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardMetrics);
router.put('/approve', approveRequest);
router.put('/reject', rejectRequest);

export default router;
