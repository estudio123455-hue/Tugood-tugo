import { Redis } from '@upstash/redis';
import bcrypt from 'bcryptjs';

// Configuración
const OTP_EXPIRATION = 10 * 60; // 10 minutos en segundos
const MAX_ATTEMPTS = 5; // Máximo de intentos de verificación
const OTP_LENGTH = 6; // Longitud del código OTP

// Inicializar cliente de Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Claves para Redis
const getOTPKey = (email) => `otp:${email}`;
const getAttemptsKey = (email) => `otp_attempts:${email}`;

class OTPUpstashService {
  /**
   * Genera un OTP aleatorio de 6 dígitos
   * @returns {string} Código OTP
   */
  static generateOTP() {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < OTP_LENGTH; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    
    return otp;
  }

  /**
   * Almacena un OTP en Upstash Redis
   * @param {string} email - Email del usuario
   * @returns {Promise<{success: boolean, otp?: string, error?: string}>} Resultado de la operación
   */
  static async createOTP(email) {
    try {
      // Verificar intentos previos
      const attempts = await this.getRemainingAttempts(email);
      if (attempts >= MAX_ATTEMPTS) {
        return { 
          success: false, 
          error: 'Has excedido el número máximo de intentos. Por favor, espera un momento.' 
        };
      }

      // Generar OTP
      const otp = this.generateOTP();
      const hashedOTP = await bcrypt.hash(otp, 10);
      
      // Almacenar en Redis
      await redis.set(
        getOTPKey(email), 
        hashedOTP,
        { ex: OTP_EXPIRATION }
      );
      
      // Reiniciar contador de intentos
      await redis.set(
        getAttemptsKey(email),
        '0',
        { ex: OTP_EXPIRATION }
      );
      
      return { success: true, otp };
    } catch (error) {
      console.error('Error al crear OTP:', error);
      return { 
        success: false, 
        error: 'Error al generar el código de verificación. Por favor, inténtalo de nuevo.' 
      };
    }
  }

  /**
   * Verifica un OTP
   * @param {string} email - Email del usuario
   * @param {string} otp - Código OTP a verificar
   * @returns {Promise<{success: boolean, message: string}>} Resultado de la verificación
   */
  static async verifyOTP(email, otp) {
    try {
      // Verificar intentos
      const attempts = await this.getRemainingAttempts(email);
      if (attempts >= MAX_ATTEMPTS) {
        return { 
          success: false, 
          message: 'Has excedido el número máximo de intentos. Por favor, solicita un nuevo código.' 
        };
      }
      
      // Obtener OTP almacenado
      const hashedOTP = await redis.get(getOTPKey(email));
      if (!hashedOTP) {
        return { 
          success: false, 
          message: 'El código ha expirado o no es válido. Por favor, solicita uno nuevo.' 
        };
      }
      
      // Verificar OTP
      const isValid = await bcrypt.compare(otp, hashedOTP);
      
      if (!isValid) {
        // Incrementar contador de intentos fallidos
        await redis.incr(getAttemptsKey(email));
        const remainingAttempts = MAX_ATTEMPTS - (attempts + 1);
        
        return { 
          success: false, 
          message: `Código incorrecto. Te quedan ${remainingAttempts} intentos.` 
        };
      }
      
      // Si es válido, eliminar el OTP
      await redis.del(getOTPKey(email));
      await redis.del(getAttemptsKey(email));
      
      return { 
        success: true, 
        message: 'Código verificado correctamente.' 
      };
      
    } catch (error) {
      console.error('Error al verificar OTP:', error);
      return { 
        success: false, 
        message: 'Error al verificar el código. Por favor, inténtalo de nuevo.' 
      };
    }
  }
  
  /**
   * Obtiene el número de intentos restantes
   * @param {string} email - Email del usuario
   * @returns {Promise<number>} Número de intentos restantes
   */
  static async getRemainingAttempts(email) {
    try {
      const attempts = await redis.get(getAttemptsKey(email));
      return parseInt(attempts || '0');
    } catch (error) {
      console.error('Error al obtener intentos restantes:', error);
      return 0;
    }
  }
}

export default OTPUpstashService;
