import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Simple in-memory storage for active OTP codes
const activeOtps = new Map();

// Helper to sign JWT tokens
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'suvidha_secret', {
    expiresIn: '30d'
  });
};

/**
 * @desc    Generate OTP for mobile number
 * @route   POST /auth/login
 * @access  Public
 */
export const requestOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number' });
    }

    // Generate a fixed OTP for ease of hackathon demo, or a random one
    // Fallback: 123456 is always accepted
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    activeOtps.set(mobile, generatedOtp);

    console.log(`[SMS Gateway Simulator] Sending OTP: ${generatedOtp} to +91 ${mobile}`);

    // Return the generated OTP in response *exclusively* for hackathon UI automation/testing ease
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
 * @route   POST /auth/verify-otp
 * @access  Public
 */
export const verifyOtp = async (req, res) => {
  try {
    const { mobile, otp, name, aadhaar } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile and OTP fields are mandatory' });
    }

    const savedOtp = activeOtps.get(mobile);

    // Allow mock pass '123456' or the actual generated code
    if (otp !== '123456' && otp !== savedOtp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Try again or use 123456.' });
    }

    // Remove OTP from cache after use
    activeOtps.delete(mobile);

    // Check if user exists in database
    let user = await User.findOne({ mobile });

    if (!user) {
      // Create new citizen profile dynamically
      user = await User.create({
        name: name || 'Rohan Sharma',
        mobile,
        aadhaar: aadhaar || undefined,
        role: 'citizen'
      });
    } else if (aadhaar && !user.aadhaar) {
      // Update Aadhaar if not present
      user.aadhaar = aadhaar;
      await user.save();
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
