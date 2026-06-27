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
  status: {
    type: String,
    enum: ['Pending', 'In-Progress', 'Approved', 'Rejected', 'Completed', 'Escalated'],
    default: 'Pending'
  },
  assignedDepartment: {
    type: String,
    trim: true,
    default: 'Nodal Dispatch Cell'
  },
  documents: [
    {
      name: { type: String, required: true },
      path: { type: String, required: true },
      verified: { type: Boolean, default: false },
      confidence: { type: Number, default: 1.0 }
    }
  ]
}, {
  timestamps: true
});

export const Request = mongoose.model('Request', requestSchema);
export default Request;
