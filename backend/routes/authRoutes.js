import express from 'express';
import { requestOtp, verifyOtp } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', requestOtp);
router.post('/verify-otp', verifyOtp);

export default router;
