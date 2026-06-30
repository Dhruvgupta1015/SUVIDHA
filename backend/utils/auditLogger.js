import AuditLog from '../models/AuditLog.js';
import logger from './logger.js';

/**
 * Robust government-grade audit log injector
 * @param {Object} params
 * @param {String} params.actorId - ObjectId of the user/officer performing action
 * @param {String} params.actorRole - 'admin' | 'officer' | 'citizen' | 'system'
 * @param {String} params.action - The predefined enum action string
 * @param {String} params.targetRequest - ObjectId of the complaint/request
 * @param {Object} params.metadata - JSON blob with any contextual info (e.g. prev/new status)
 * @param {String} params.ipAddress - Optional IP address string
 */
export const logAudit = async ({ actorId, actorRole, action, targetRequest, metadata = {}, ipAddress = null }) => {
  try {
    const log = new AuditLog({
      actorId,
      actorRole,
      action,
      targetRequest,
      metadata,
      ipAddress
    });
    
    await log.save();
    
    // Also push a debug trace to the Winston logger
    logger.info(`[AUDIT TRAIL] ${actorRole} performed ${action} on request ${targetRequest}`);
    
  } catch (error) {
    // We swallow the error so it doesn't break the main business flow, but we MUST alert Winston
    logger.critical(`[AUDIT FAIL] Failed to write to audit log! Action: ${action} Request: ${targetRequest}. Error: ${error.message}`);
  }
};
