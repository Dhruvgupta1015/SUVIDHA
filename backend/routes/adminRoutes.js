import express from 'express';
import { 
  getDashboardMetrics, 
  getOfficers, 
  createOfficer, 
  deleteOfficer,
  getTelemetryLogs,
  getAuditLogs,
  getAuditMetrics
} from '../controllers/adminController.js';
import { seedDemoScenario, getAdvancedAnalytics, getSystemHealth } from '../controllers/demoController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

// Core admin
router.get('/dashboard',    getDashboardMetrics);
router.get('/officers',     getOfficers);
router.post('/officers',    createOfficer);
router.delete('/officers/:id', deleteOfficer);
router.get('/telemetry',    getTelemetryLogs);

// Phase 5: Audit APIs
router.get('/audit-logs', getAuditLogs);
router.get('/audit-metrics', getAuditMetrics);

// T3: Advanced analytics
router.get('/analytics',    getAdvancedAnalytics);

// T8: System health panel
router.get('/health',       getSystemHealth);

// T4: Demo mode engine
router.post('/demo-seed',   seedDemoScenario);

export default router;
