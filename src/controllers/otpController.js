import OTPService from '../services/otpService.js';
import { sendOTPEmail } from '../../backend/src/services/emailService.js';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import redis from '../config/redis.js';

// Configuración de rate limiting
const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'otp_rate_limit',
  points: 5, // 5 solicitudes
  duration: 3600, // por hora
  blockDuration: 3600, // bloquear por 1 hora si se excede
});

/**
 * Controlador para solicitar un nuevo OTP
 */
const requestOTP = async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'El correo electrónico es requerido' 
    });
  }

  try {
    // Verificar rate limit
    const rateLimitKey = `otp_limit:${email}`;
    try {
      await rateLimiter.consume(rateLimitKey, 1);
    } catch (rateLimitError) {
      return res.status(429).json({
        success: false,
        message: 'Demasiadas solicitudes. Por favor, inténtalo más tarde.'
      });
    }

    // Verificar si ya existe un OTP activo
    const hasActiveOTP = await OTPService.hasActiveOTP(email);
    if (hasActiveOTP) {
      return res.status(400).json({
        success: false,
        message: 'Ya hay un código activo. Revisa tu correo o espera a que expire.'
      });
    }

    // Generar y almacenar OTP
    const otp = OTPService.generateOTP();
    const stored = await OTPService.storeOTP(email, otp);
    
    if (!stored) {
      return res.status(500).json({
        success: false,
        message: 'Error al generar el código de verificación. Por favor, inténtalo de nuevo.'
      });
    }

      // Enviar OTP por correo
      try {
        const emailSent = await sendOTPEmail(email, otp);
        if (!emailSent) {
          return res.status(500).json({
            success: false,
            message: 'Error al enviar el código de verificación. Por favor, inténtalo de nuevo.'
          });
        }

        res.json({
          success: true,
          message: 'Código de verificación enviado a tu correo',
          // En producción, no devolver el OTP
          // otp: process.env.NODE_ENV === 'development' ? otp : undefined
        });
      } catch (emailError) {
        console.error('Error al enviar correo:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Error al enviar el correo de verificación. Por favor, inténtalo de nuevo más tarde.'
        });
      }
  } catch (error) {
    console.error('Error en requestOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud. Intenta de nuevo.'
    });
  }
};

/**
 * Controlador para verificar un OTP
 */
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ 
      success: false, 
      message: 'Correo electrónico y código son requeridos' 
    });
  }

  try {
    const result = await OTPService.verifyStoredOTP(email, otp);
    
    if (result.valid) {
      // Aquí puedes generar un token JWT o marcar el email como verificado
      return res.json({
        success: true,
        message: 'Código verificado correctamente',
        // token: generateAuthToken(email) // Implementa según tu sistema de autenticación
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error en verifyOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar el código. Intenta de nuevo.'
    });
  }
};

export { requestOTP, verifyOTP };
