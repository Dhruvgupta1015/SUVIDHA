import express from 'express';
import {
  createRequest,
  createEmergencyRequest,
  checkAndEscalateSla,
  getRequestById,
  getCitizenRequests,
  getDepartmentRequests,
  updateRequestStatus,
  evidenceAction,
  reuploadEvidence,
  deleteRequest,
  getComplaintAuditLogs
} from '../controllers/requestController.js';
import { generateReceipt } from '../utils/pdfGenerator.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create',                protect,                               createRequest);
router.post('/emergency',             protect,                               createEmergencyRequest);
router.post('/check-escalations',     protect, authorize('admin'),           checkAndEscalateSla);
router.get('/my-requests',            protect,                               getCitizenRequests);
router.get('/department',             protect, authorize('officer', 'admin'), getDepartmentRequests);
router.get('/:id/receipt',                                                    generateReceipt);   // T1: PDF receipt
router.get('/:id',                                                            getRequestById);
router.put('/:id/action',             protect, authorize('officer', 'admin'), updateRequestStatus);
router.put('/:id/evidence-action',    protect, authorize('officer', 'admin'), evidenceAction);
router.put('/:id/reupload',           protect,                               reuploadEvidence);
router.delete('/:id',                 protect,                               deleteRequest);
router.get('/:id/audit-logs',         protect,                               getComplaintAuditLogs);

export default router;
