import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    default: () => `REQ-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
  },
  citizenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Request must reference a citizen user']
  },
  serviceType: {
    type: String,
    required: [true, 'Please specify the service category (electricity, water, gas, waste, general)'],
    enum: ['electricity', 'water', 'gas', 'waste', 'general']
  },
  subService: {
    type: String,
    required: [true, 'Please specify sub-service details']
  },
  description: {
    type: String,
    required: [true, 'Please enter request/complaint description details'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'In-Progress', 'Approved', 'Rejected', 'Completed'],
    default: 'Pending'
  },
  assignedDepartment: {
    type: String,
    trim: true,
    default: 'General Administration'
  },
  assignedTeam: {
    type: String,
    trim: true,
    default: 'Unassigned'
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  },

  // ── AI Priority Engine fields ───────────────────────────────────────────────
  priority: {
    type: String,
    enum: ['Standard', 'High', 'Critical'],
    default: 'Standard'
  },
  priorityScore: {
    type: Number,
    default: 0                           // cumulative keyword score from priorityEngine
  },
  priorityReason: {
    type: String,
    default: 'No urgency keywords detected — routine complaint'
  },

  // ── Emergency flags ─────────────────────────────────────────────────────────
  isEmergency: {
    type: Boolean,
    default: false
  },
  emergencySource: {
    type: String,
    enum: ['AI', 'Citizen', 'Officer', 'Admin', null],
    default: null                        // T4: who triggered the emergency flag
  },
  emergencyTriggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null                        // T4: user reference who triggered
  },
  emergencyTriggeredAt: {
    type: Date,
    default: null                        // T4: timestamp of emergency trigger
  },

  // ── SLA Intelligence fields ─────────────────────────────────────────────────
  slaStatus: {
    type: String,
    enum: ['Safe', 'Warning', 'Critical', 'Escalated'],
    default: 'Safe'
  },
  escalatedAt: {
    type: Date,
    default: null                        // T3: when auto-escalation fired (prevents re-trigger)
  },

  // ── Smart Routing fields ────────────────────────────────────────────────────
  routingReason: {
    type: String,
    default: ''
  },
  routingConfidence: {
    type: Number,
    default: 0.65                        // T2: 0.0–1.0 routing confidence score
  },

  // ── Persistent Urgent Events log ────────────────────────────────────────────
  urgentEvents: [                        // T5: persistent alert memory
    {
      message:   { type: String, required: true },
      type:      { type: String, enum: ['emergency', 'critical', 'escalation', 'info'], default: 'info' },
      timestamp: { type: Date, default: Date.now }
    }
  ],

  // ── Evidence documents ──────────────────────────────────────────────────────
  documents: [
    {
      name:        { type: String, required: true },
      secureUrl:   { type: String, required: true },
      publicId:    { type: String, required: true },
      mimeType:    { type: String },
      size:        { type: Number },
      uploadedAt:  { type: Date, default: Date.now },
      verified:    { type: Boolean, default: false },
      confidence:  { type: Number,  default: 1.0 },
      flagged:     { type: Boolean, default: false },   // true if confidence < 0.50
      reason:      { type: String,  default: '' },       // AI scoring rationale
      reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      reviewedAt:  { type: Date,    default: null }
    }
  ]
}, {
  timestamps: true
});

// Performance Indexes (Layer 13)
requestSchema.index({ citizenId: 1 });
requestSchema.index({ assignedDepartment: 1, status: 1 });
requestSchema.index({ createdAt: -1 });

export const Request = mongoose.model('Request', requestSchema);
export default Request;
