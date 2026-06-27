import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: [true, 'Complaint details must bind to a Request ticket']
  },
  complaintType: {
    type: String,
    required: [true, 'Please specify the complaint sub-category type']
  },
  description: {
    type: String,
    required: [true, 'Please enter complaint description details'],
    trim: true
  },
  evidenceFiles: [
    {
      name: { type: String },
      path: { type: String }
    }
  ],
  priority: {
    type: String,
    enum: ['Standard', 'High', 'Critical'],
    default: 'Standard'
  }
}, {
  timestamps: true
});

export const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
