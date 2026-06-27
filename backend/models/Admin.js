import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add admin official name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add admin email'],
    unique: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a login password'],
    minlength: 6,
    select: false // hides password from query results by default
  },
  role: {
    type: String,
    default: 'admin'
  },
  department: {
    type: String,
    required: [true, 'Please specify official department jurisdiction'],
    default: 'Municipal Corporation General Office'
  }
}, {
  timestamps: true
});

export const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
