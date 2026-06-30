import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Simple in-memory storage for active OTP codes
const activeOtps = new Map();

// Helper to sign JWT tokens — 8-hour expiry aligns with a full working session
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'suvidha_secret', {
    expiresIn: '8h'
  });
};

/**
 * @desc    Generate OTP for mobile number
 * @route   POST /api/auth/login
 * @access  Public
 */
export const requestOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number' });
    }

    // Generate a simulated OTP (always accept '123456' as fallback, but generate random)
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    activeOtps.set(mobile, generatedOtp);

    console.log(`[SMS Gateway Simulator] Sending OTP: ${generatedOtp} to +91 ${mobile}`);

    return res.status(200).json({
      success: true,
      message: 'OTP generated and sent successfully (SMS Simulated)',
      demoOtp: generatedOtp
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Verify OTP and return JWT token (Signs up if first-time user)
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOtp = async (req, res) => {
  try {
    const { mobile, otp, name, aadhaar } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile and OTP fields are mandatory' });
    }

    const savedOtp = activeOtps.get(mobile);

    // Allow mock pass '123456' only in non-production environments (demo/dev)
    const isDemoAllowed = process.env.NODE_ENV !== 'production';
    if (otp !== savedOtp && !(isDemoAllowed && otp === '123456')) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please retry.' });
    }

    // Remove OTP from cache after use
    activeOtps.delete(mobile);

    // Check if user exists in database
    let user = await User.findOne({ mobile });

    if (!user) {
      // Create new citizen profile dynamically
      user = await User.create({
        name: name || 'New Citizen',
        mobile,
        aadhaar: aadhaar || undefined,
        role: 'citizen'
      });
    } else {
      if (aadhaar && !user.aadhaar) {
        user.aadhaar = aadhaar;
        await user.save();
      }
      if (name && user.name === 'New Citizen') {
        user.name = name;
        await user.save();
      }
    }

    // Sign Token
    const token = generateToken({ id: user._id, role: user.role });

    return res.status(200).json({
      success: true,
      message: 'Citizen authenticated successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        aadhaar: user.aadhaar ? `XXXX-XXXX-${user.aadhaar.slice(-4)}` : null, // masked representation
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Staff Login (Officer/Admin email + password verification)
 * @route   POST /api/auth/staff-login
 * @access  Public
 */
export const staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const emailClean = email?.trim().toLowerCase();
    const passwordClean = password?.trim();

    if (!emailClean || !passwordClean) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find staff user
    const user = await User.findOne({
      email: emailClean
    }).select('+password');

    if (!user || (user.role !== 'officer' && user.role !== 'admin')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or user is not authorized staff'
      });
    }

    // Password check
    if (passwordClean !== user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT
    const token = generateToken({
      id: user._id,
      role: user.role,
      department: user.department
    });

    return res.status(200).json({
      success: true,
      message: `${user.role.toUpperCase()} authenticated successfully`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};