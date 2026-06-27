import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  mobile: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    match: [/^\d{10}$/, 'Please add a valid 10-digit mobile number']
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email address']
  },
  password: {
    type: String,
    minlength: 6,
    select: false // hides password from query results by default
  },
  aadhaar: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    match: [/^\d{12}$/, 'Please add a valid 12-digit Aadhaar ID']
  },
  role: {
    type: String,
    enum: ['citizen', 'officer', 'admin'],
    default: 'citizen'
  },
  department: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export const User = mongoose.model('User', userSchema);
export default User;
