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
  priority: {
    type: String,
    enum: ['Standard', 'High', 'Critical'],
    default: 'Standard'
  },
  priorityReason: {
    type: String,
    default: 'No urgency keywords detected — routine complaint'
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  slaStatus: {
    type: String,
    enum: ['Safe', 'Warning', 'Critical', 'Escalated'],
    default: 'Safe'
  },
  routingReason: {
    type: String,
    default: ''
  },
  documents: [
    {
      name:        { type: String, required: true },
      path:        { type: String, required: true },
      verified:    { type: Boolean, default: false },
      confidence:  { type: Number,  default: 1.0 },
      flagged:     { type: Boolean, default: false },   // true if confidence < 0.50 (suspicious)
      reason:      { type: String,  default: '' },       // AI scoring rationale
      reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // officer who reviewed
      reviewedAt:  { type: Date,    default: null }      // when officer reviewed
    }
  ]
}, {
  timestamps: true
});

export const Request = mongoose.model('Request', requestSchema);
export default Request;
