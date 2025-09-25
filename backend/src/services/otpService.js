import bcrypt from 'bcryptjs';

// Configuración
const OTP_EXPIRATION = 10 * 60; // 10 minutos en segundos
const MAX_ATTEMPTS = 5; // Máximo de intentos de verificación
const OTP_LENGTH = 6; // Longitud del código OTP

// Clave para almacenar los intentos de OTP
const getAttemptsKey = (email) => `otp_attempts:${email}`;

// Importar el cliente Redis configurado en server.js
const { redisClient } = global || {};

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
      if (!redisClient) {
        console.error('Redis client no está disponible');
        return false;
      }

      const key = `otp:${email}`;
      const attemptsKey = getAttemptsKey(email);
      const hashedOTP = await this.hashOTP(otp);
      
      // Almacenar el OTP y los intentos
      await redisClient.set(key, hashedOTP, { ex: OTP_EXPIRATION });
      await redisClient.set(attemptsKey, '0', { ex: OTP_EXPIRATION });
      
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
      if (!redisClient) {
        console.error('Redis client no está disponible');
        return { valid: false, message: 'Error interno del servidor. Intenta de nuevo.' };
      }

      const key = `otp:${email}`;
      const attemptsKey = getAttemptsKey(email);
      
      // Verificar intentos
      const attempts = parseInt(await redisClient.get(attemptsKey) || '0');
      if (attempts >= MAX_ATTEMPTS) {
        return { valid: false, message: 'Demasiados intentos. Por favor, solicita un nuevo código.' };
      }
      
      // Obtener OTP almacenado
      const hashedOTP = await redisClient.get(key);
      if (!hashedOTP) {
        return { valid: false, message: 'Código expirado o inválido. Solicita uno nuevo.' };
      }
      
      // Verificar OTP
      const isValid = await this.verifyOTP(otp, hashedOTP);
      
      if (isValid) {
        // Eliminar OTP después de uso exitoso
        await redisClient.del(key);
        await redisClient.del(attemptsKey);
        return { valid: true, message: 'Código verificado correctamente.' };
      } else {
        // Incrementar contador de intentos fallidos
        await redisClient.incr(attemptsKey);
        await redisClient.expire(attemptsKey, OTP_EXPIRATION);
        
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
    if (!redisClient) {
      console.error('Redis client no está disponible');
      return false;
    }
    
    const key = `otp:${email}`;
    try {
      const exists = await redisClient.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Error checking active OTP:', error);
      return false;
    }
  }
}

export default OTPService;
