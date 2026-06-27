import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  mobile: {
    type: String,
    required: [true, 'Please add a mobile number'],
    unique: true,
    trim: true,
    match: [/^\d{10}$/, 'Please add a valid 10-digit mobile number']
  },
  aadhaar: {
    type: String,
    unique: true,
    trim: true,
    sparse: true, // Allows null/empty values without throwing duplicate errors
    match: [/^\d{12}$/, 'Please add a valid 12-digit Aadhaar ID']
  },
  role: {
    type: String,
    enum: ['citizen', 'operator'],
    default: 'citizen'
  }
}, {
  timestamps: true
});

export const User = mongoose.model('User', userSchema);
export default User;
