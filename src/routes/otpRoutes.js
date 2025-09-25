const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');
const { body } = require('express-validator');

// Middleware de validación
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  next();
};

// Ruta para solicitar un nuevo OTP
router.post(
  '/request',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Por favor, proporciona un correo electrónico válido')
  ],
  validateRequest,
  otpController.requestOTP
);

// Ruta para verificar un OTP
router.post(
  '/verify',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Por favor, proporciona un correo electrónico válido'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('El código debe tener 6 dígitos')
      .isNumeric()
      .withMessage('El código debe contener solo números')
  ],
  validateRequest,
  otpController.verifyOTP
);

module.exports = router;
