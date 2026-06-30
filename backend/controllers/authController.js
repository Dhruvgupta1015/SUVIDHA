import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getRedis } from '../config/redis.js';
import { sendOTP } from '../services/smsService.js';
import logger from '../utils/logger.js';
import * as Sentry from '@sentry/node';

// Helper to sign JWT tokens — 8-hour expiry aligns with a full working session
const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') throw new Error('FATAL ERROR: JWT_SECRET is not defined in production');
    logger.warn('JWT_SECRET missing, using insecure fallback');
  }
  return jwt.sign(payload, secret || 'suvidha_secret', {
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

    const redis = getRedis();
    const rateKey = `rate_limit:${mobile}`;
    const otpKey = `otp:${mobile}`;
    const attemptKey = `attempts:${mobile}`;

    // Rate Limiting: Max 3 requests per hour
    const requests = await redis.incr(rateKey);
    if (requests > 3) {
      return res.status(429).json({ success: false, message: 'Too many OTP requests. Please try again after an hour.' });
    }

    // Generate 6-digit secure OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP and attempts in Redis (5-minute expiry)
    await redis.setEx(otpKey, 300, generatedOtp);
    await redis.setEx(attemptKey, 300, 0);

    // Dispatch SMS via provider (Twilio or mock fallback)
    await sendOTP(mobile, generatedOtp);

    return res.status(200).json({
      success: true,
      message: 'OTP generated and sent via SMS',
      demoOtp: generatedOtp // Kept for hackathon fallback purposes
    });
  } catch (error) {
    Sentry.captureException(error);
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

    const redis = getRedis();
    const otpKey = `otp:${mobile}`;
    const attemptKey = `attempts:${mobile}`;

    const savedOtp = await redis.get(otpKey);

    // '123456' is a permanent demo passkey for hackathon stability.
    if (otp !== '123456') {
      if (!savedOtp) {
        return res.status(400).json({ success: false, message: 'OTP expired or not requested. Please request a new one.' });
      }

      // Max 3 retries brute force protection
      const attempts = await redis.incr(attemptKey);
      if (attempts > 3) {
        await redis.del(otpKey); // Invalidate OTP completely
        logger.warn(`[Auth] Brute force OTP attempt blocked for mobile: ${mobile}`);
        req.app.get('io').emit('urgentAlert', {
          message: `Suspicious activity: Repeated failed OTP attempts for ${mobile}.`,
          priority: 'High',
          time: new Date().toLocaleTimeString()
        });
        Sentry.captureMessage(`Repeated failed OTP attempts for ${mobile}`, 'warning');
        return res.status(429).json({ success: false, message: 'Max verification attempts exceeded. Please request a new OTP.' });
      }

      if (otp !== savedOtp) {
        return res.status(400).json({ success: false, message: `Invalid OTP code. ${3 - attempts} attempts remaining.` });
      }
    }

    // Clean up cache upon success
    await redis.del(otpKey);
    await redis.del(attemptKey);

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
    Sentry.captureException(error);
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
      logger.warn(`[Auth] Failed staff login attempt for: ${emailClean}`);
      if (user.role === 'admin') {
        req.app.get('io').emit('urgentAlert', {
          message: `Suspicious activity: Failed login attempt on Admin account ${emailClean}.`,
          priority: 'High',
          time: new Date().toLocaleTimeString()
        });
      }
      Sentry.captureMessage(`Failed staff login attempt for: ${emailClean}`, 'warning');
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
    Sentry.captureException(error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};