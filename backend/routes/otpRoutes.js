import express from 'express';
import { body, validationResult } from 'express-validator';
import OTPService from '../../src/services/otpService.js';
import emailService from '../../src/services/emailService.js';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { createClient } from 'redis';

const router = express.Router();

// Configuración de rate limiting para OTP
const otpRateLimiter = new RateLimiterRedis({
  storeClient: redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  }),
  keyPrefix: 'otp_rate_limit',
  points: 3, // Número de intentos permitidos
  duration: 3600, // Período en segundos (1 hora)
  blockDuration: 3600, // Bloquear por 1 hora después de exceder el límite
});

/**
 * @route   POST /api/otp/request
 * @desc    Solicitar un nuevo OTP por correo electrónico
 * @access  Public
 */
router.post(
  '/request',
  [
    body('email').isEmail().withMessage('Por favor ingresa un correo electrónico válido'),
  ],
  async (req, res) => {
    try {
      // Validar datos de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { email } = req.body;

      // Aplicar rate limiting
      try {
        await otpRateLimiter.consume(`email:${email}`);
      } catch (rlRejected) {
        if (rlRejected instanceof Error) {
          throw rlRejected;
        }
        return res.status(429).json({ 
          success: false, 
          message: 'Demasiadas solicitudes. Por favor, inténtalo de nuevo más tarde.' 
        });
      }

      // Verificar si ya hay un OTP activo
      const hasActiveOTP = await OTPService.hasActiveOTP(email);
      if (hasActiveOTP) {
        return res.status(400).json({ 
          success: false, 
          message: 'Ya se ha enviado un código de verificación a tu correo. Por favor, revisa tu bandeja de entrada o inténtalo de nuevo en unos minutos.' 
        });
      }

      // Generar y almacenar OTP
      const otp = OTPService.generateOTP();
      await OTPService.storeOTP(email, otp);

      // Enviar OTP por correo
      await emailService.sendOTPEmail(email, otp);

      res.status(200).json({ 
        success: true, 
        message: 'Código de verificación enviado con éxito' 
      });
    } catch (error) {
      console.error('Error al solicitar OTP:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al procesar la solicitud de verificación',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   POST /api/otp/verify
 * @desc    Verificar un OTP
 * @access  Public
 */
router.post(
  '/verify',
  [
    body('email').isEmail().withMessage('Por favor ingresa un correo electrónico válido'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('El código de verificación debe tener 6 dígitos')
  ],
  async (req, res) => {
    try {
      // Validar datos de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { email, otp } = req.body;

      // Verificar OTP
      const result = await OTPService.verifyStoredOTP(email, otp);
      
      if (result.valid) {
        // Aquí podrías generar un token JWT si el OTP es válido
        return res.status(200).json({ 
          success: true, 
          message: result.message,
          // token: 'tu_jwt_token_aqui' // Descomenta cuando implementes JWT
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          message: result.message 
        });
      }
    } catch (error) {
      console.error('Error al verificar OTP:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al verificar el código de verificación',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

export default router;
