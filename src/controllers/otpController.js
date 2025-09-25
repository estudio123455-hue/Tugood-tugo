const OTPService = require('../services/otpService');
const emailService = require('./emailService');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const redis = require('../config/redis');

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
    await OTPService.storeOTP(email, otp);

    // Enviar OTP por correo (implementa esta función según tu proveedor de correo)
    await emailService.sendOTPEmail(email, otp);

    res.json({
      success: true,
      message: 'Código de verificación enviado a tu correo',
      // En producción, no devolver el OTP
      // otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
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

module.exports = {
  requestOTP,
  verifyOTP
};
