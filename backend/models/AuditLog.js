import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Null if system action
  },
  actorRole: {
    type: String,
    enum: ['admin', 'officer', 'citizen', 'system'],
    required: true
  },
  action: {
    type: String,
    enum: [
      'complaint_created',
      'evidence_uploaded',
      'evidence_approved',
      'evidence_rejected',
      'reupload_requested',
      'status_updated',
      'sla_escalated',
      'emergency_triggered',
      'admin_override'
    ],
    required: true
  },
  targetRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  metadata: {
    type: Object, // Flexible JSON blob for context
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  }
}, {
  timestamps: true, // Auto createdAt
  capped: { size: 104857600, max: 100000, autoIndexId: true } // 100MB cap for automatic retention logic (approx 100k logs)
});

// Protect against deletion and modification via middleware
auditLogSchema.pre('findOneAndUpdate', function(next) {
  next(new Error('Audit logs are immutable. Updates are forbidden.'));
});
auditLogSchema.pre('updateOne', function(next) {
  next(new Error('Audit logs are immutable. Updates are forbidden.'));
});
auditLogSchema.pre('deleteOne', function(next) {
  next(new Error('Audit logs are strictly append-only. Deletions are forbidden.'));
});
auditLogSchema.pre('deleteMany', function(next) {
  next(new Error('Audit logs are strictly append-only. Deletions are forbidden.'));
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
