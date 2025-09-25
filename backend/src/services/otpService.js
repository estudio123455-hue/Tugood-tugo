import bcrypt from 'bcryptjs';
import redis from '../config/redis.js';

// Configuración
const OTP_EXPIRATION = 10 * 60; // 10 minutos en segundos
const MAX_ATTEMPTS = 5; // Máximo de intentos de verificación
const OTP_LENGTH = 6; // Longitud del código OTP

class OTPService {
  /**
   * Genera un OTP aleatorio
   * @returns {string} Código OTP de 6 dígitos
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
   * Hashea un OTP para almacenamiento seguro
   * @param {string} otp - Código OTP en texto plano
   * @returns {Promise<string>} Hash del OTP
   */
  static async hashOTP(otp) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(otp, salt);
  }

  /**
   * Compara un OTP con su hash
   * @param {string} otp - Código OTP en texto plano
   * @param {string} hashedOTP - Hash del OTP
   * @returns {Promise<boolean>} True si coinciden
   */
  static async verifyOTP(otp, hashedOTP) {
    return bcrypt.compare(otp, hashedOTP);
  }

  /**
   * Almacena un OTP en Redis
   * @param {string} email - Email del usuario
   * @param {string} otp - Código OTP en texto plano
   * @returns {Promise<boolean>} True si se almacenó correctamente
   */
  static async storeOTP(email, otp) {
    try {
      const key = `otp:${email}`;
      const attemptsKey = `otp_attempts:${email}`;
      const hashedOTP = await this.hashOTP(otp);
      
      // Almacenar el OTP y los intentos
      const multi = redis.multi();
      multi.setex(key, OTP_EXPIRATION, hashedOTP);
      multi.setex(attemptsKey, OTP_EXPIRATION, '0');
      
      await multi.exec();
      return true;
    } catch (error) {
      console.error('Error storing OTP:', error);
      return false;
    }
  }

  /**
   * Verifica un OTP
   * @param {string} email - Email del usuario
   * @param {string} otp - Código OTP a verificar
   * @returns {Promise<{valid: boolean, message: string}>} Resultado de la verificación
   */
  static async verifyStoredOTP(email, otp) {
    try {
      const key = `otp:${email}`;
      const attemptsKey = `otp_attempts:${email}`;
      
      // Verificar intentos
      const attempts = parseInt(await redis.get(attemptsKey) || '0');
      if (attempts >= MAX_ATTEMPTS) {
        return { valid: false, message: 'Demasiados intentos. Por favor, solicita un nuevo código.' };
      }
      
      // Obtener OTP almacenado
      const hashedOTP = await redis.get(key);
      if (!hashedOTP) {
        return { valid: false, message: 'Código expirado o inválido. Solicita uno nuevo.' };
      }
      
      // Verificar OTP
      const isValid = await this.verifyOTP(otp, hashedOTP);
      
      // Incrementar contador de intentos
      await redis.incr(attemptsKey);
      
      if (isValid) {
        // Eliminar OTP después de uso exitoso
        await redis.del(key);
        await redis.del(attemptsKey);
        return { valid: true, message: 'Código verificado correctamente.' };
      } else {
        const remainingAttempts = MAX_ATTEMPTS - (attempts + 1);
        return { 
          valid: false, 
          message: `Código incorrecto. Te quedan ${remainingAttempts} intentos.`
        };
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { valid: false, message: 'Error al verificar el código. Intenta de nuevo.' };
    }
  }

  /**
   * Verifica si un email tiene un OTP activo
   * @param {string} email - Email a verificar
   * @returns {Promise<boolean>} True si existe un OTP activo
   */
  static async hasActiveOTP(email) {
    const key = `otp:${email}`;
    const ttl = await redis.ttl(key);
    return ttl > 0;
  }
}

export default OTPService;
