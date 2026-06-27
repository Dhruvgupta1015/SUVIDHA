import express from 'express';
import { 
  getDashboardMetrics, 
  getOfficers, 
  createOfficer, 
  deleteOfficer 
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardMetrics);
router.get('/officers', getOfficers);
router.post('/officers', createOfficer);
router.delete('/officers/:id', deleteOfficer);

export default router;
