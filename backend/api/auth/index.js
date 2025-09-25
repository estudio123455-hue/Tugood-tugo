import { Router } from 'express';
import { login } from './login.js';
import { register } from './register.js';
import { requestOTP, verifyOTP } from './otp.js';

const router = Router();

// Auth routes
router.post('/login', login);
router.post('/register', register);

// OTP routes
router.post('/otp/request', requestOTP);
router.post('/otp/verify', verifyOTP);

export default router;
