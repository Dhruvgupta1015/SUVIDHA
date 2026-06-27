import express from 'express';
import { requestOtp, verifyOtp, staffLogin } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/staff-login', staffLogin);

export default router;
