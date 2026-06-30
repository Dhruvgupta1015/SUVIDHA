import express from 'express';
import {
  createRequest,
  getRequestById,
  getCitizenRequests,
  getDepartmentRequests,
  updateRequestStatus,
  evidenceAction,
  reuploadeEvidence
} from '../controllers/requestController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create',                protect,                             createRequest);
router.get('/my-requests',            protect,                             getCitizenRequests);
router.get('/department',             protect, authorize('officer', 'admin'), getDepartmentRequests);
router.get('/:id',                                                         getRequestById);
router.put('/:id/action',             protect, authorize('officer', 'admin'), updateRequestStatus);
router.put('/:id/evidence-action',    protect, authorize('officer', 'admin'), evidenceAction);
router.put('/:id/reupload',           protect,                             reuploadeEvidence);

export default router;
