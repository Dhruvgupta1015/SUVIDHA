import express from 'express';
import { 
  createRequest, 
  getRequestById, 
  getCitizenRequests, 
  getDepartmentRequests, 
  updateRequestStatus 
} from '../controllers/requestController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', protect, createRequest);
router.get('/my-requests', protect, getCitizenRequests);
router.get('/department', protect, authorize('officer', 'admin'), getDepartmentRequests);
router.get('/:id', getRequestById);
router.put('/:id/action', protect, authorize('officer', 'admin'), updateRequestStatus);

export default router;
