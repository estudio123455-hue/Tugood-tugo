import express from 'express';
import { body } from 'express-validator';
import OTPController from '../controllers/otpController.js';

const router = express.Router();

/**
 * @route   POST /api/otp/request
 * @desc    Solicita un nuevo código OTP
 * @access  Public
 */
router.post(
  '/request',
  [
    body('email')
      .isEmail()
      .withMessage('Por favor, proporciona un correo electrónico válido.')
      .normalizeEmail()
  ],
  OTPController.requestOTP
);

/**
 * @route   POST /api/otp/verify
 * @desc    Verifica un código OTP
 * @access  Public
 */
router.post(
  '/verify',
  [
    body('email')
      .isEmail()
      .withMessage('Por favor, proporciona un correo electrónico válido.')
      .normalizeEmail(),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('El código de verificación debe tener 6 dígitos.')
      .isNumeric()
      .withMessage('El código de verificación debe contener solo números.')
  ],
  OTPController.verifyOTP
);

export default router;
