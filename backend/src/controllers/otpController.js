import OTPUpstashService from '../services/otpUpstashService.js';
import { sendOTPEmail } from '../services/emailService.js';

class OTPController {
  /**
   * Solicita un nuevo OTP por correo electrónico
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  static async requestOTP(req, res) {
    try {
      const { email } = req.body;
      
      // Validar email
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Por favor, proporciona un correo electrónico válido.'
        });
      }
      
      // Crear OTP
      const { success, otp, error } = await OTPUpstashService.createOTP(email);
      
      if (!success) {
        return res.status(400).json({ success: false, message: error });
      }
      
      // Enviar OTP por correo (en producción, esto debería ser asíncrono)
      const emailResult = await sendOTPEmail(email, otp);
      
      if (!emailResult.success) {
        console.error('Error al enviar correo:', emailResult.error);
        return res.status(500).json({
          success: false,
          message: 'Error al enviar el código de verificación. Por favor, inténtalo de nuevo.'
        });
      }
      
      // En desarrollo, también devolvemos el OTP para facilitar las pruebas
      const response = {
        success: true,
        message: 'Código de verificación enviado a tu correo electrónico.',
        // Solo incluir el OTP en desarrollo
        ...(process.env.NODE_ENV === 'development' && { otp })
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Error en la solicitud de OTP:', error);
      res.status(500).json({
        success: false,
        message: 'Error al procesar la solicitud. Por favor, inténtalo de nuevo.'
      });
    }
  }
  
  /**
   * Verifica un OTP
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   */
  static async verifyOTP(req, res) {
    try {
      const { email, otp } = req.body;
      
      // Validar entrada
      if (!email || !otp || otp.length !== 6) {
        return res.status(400).json({
          success: false,
          message: 'Por favor, proporciona un correo electrónico y un código de verificación válido.'
        });
      }
      
      // Verificar OTP
      const { success, message } = await OTPUpstashService.verifyOTP(email, otp);
      
      if (!success) {
        return res.status(400).json({ success: false, message });
      }
      
      // Aquí podrías generar un token JWT o realizar otras acciones
      // después de una verificación exitosa
      
      res.json({
        success: true,
        message,
        // token: 'tu_jwt_token_aqui' // Opcional: devolver un token de autenticación
      });
      
    } catch (error) {
      console.error('Error al verificar OTP:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar el código. Por favor, inténtalo de nuevo.'
      });
    }
  }
}

export default OTPController;
