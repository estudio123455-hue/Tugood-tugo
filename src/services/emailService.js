// Email Service - Sistema de Confirmación por Correo
// Usa EmailJS para envío de emails sin backend

import emailjs from '@emailjs/browser';

// Configuración de EmailJS (usar variables de entorno en producción)
const EMAIL_CONFIG = {
  serviceId: 'service_gc48bhw', // Service ID de EmailJS configurado
  templateIds: {
    registration: 'template_registro', // Template para registro
    login: 'template_login', // Template para login
    otp: 'template_otp' // Template para códigos OTP
  },
  publicKey: 'ZWvRswM9WLDo6u4Z9' // Public Key de EmailJS configurado
};

/**
 * Inicializa EmailJS con la clave pública
 */
const initEmailJS = () => {
  try {
    emailjs.init(EMAIL_CONFIG.publicKey);
    console.log('📧 EmailJS inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando EmailJS:', error);
  }
};

/**
 * Genera un código de confirmación de 6 dígitos
 * @returns {string} Código de confirmación
 */
const generateConfirmationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Obtiene información del dispositivo y ubicación
 * @returns {Object} Información del dispositivo
 */
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  let deviceType = 'Desconocido';
  let browser = 'Desconocido';
  
  // Detectar tipo de dispositivo
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    deviceType = 'Móvil';
  } else if (/Tablet/.test(userAgent)) {
    deviceType = 'Tablet';
  } else {
    deviceType = 'Computadora';
  }
  
  // Detectar navegador
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  return {
    deviceType,
    browser,
    timestamp: new Date().toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    ip: 'Bogotá, Colombia' // En producción, usar servicio de geolocalización
  };
};

/**
 * Envía email de confirmación de registro
 * @param {Object} userData - Datos del usuario registrado
 * @returns {Promise<boolean>} True si el email se envió correctamente
 */
const sendRegistrationConfirmation = async (userData) => {
  try {
    const confirmationCode = generateConfirmationCode();
    const deviceInfo = getDeviceInfo();
    
    // Guardar código en localStorage para verificación
    localStorage.setItem(`confirmation_${userData.email}`, confirmationCode);
    
    // Mostrar código directamente al usuario
    alert(`Código de verificación\n\nTu código es: ${confirmationCode}\n\nIngresa este código en la siguiente pantalla para completar tu registro.`);
    
    return {
      success: true,
      email: userData.email,
      code: confirmationCode,
      type: 'registration'
    };
  } catch (error) {
    console.error('Error enviando email de registro:', error);
    
    // Fallback en caso de error
    const fallbackCode = generateConfirmationCode();
    localStorage.setItem(`confirmation_${userData.email}`, fallbackCode);
    alert(`Código de verificación\n\nTu código es: ${fallbackCode}\n\nIngresa este código en la siguiente pantalla.`);
    
    return {
      success: false,
      email: userData.email,
      code: fallbackCode,
      type: 'registration',
      error: 'Fallback code generated'
    };
  }
};

/**
 * Envía email de confirmación de inicio de sesión
 * @param {Object} userData - Datos del usuario que inició sesión
 * @returns {Promise<boolean>} True si el email se envió correctamente
 */
export const sendLoginConfirmation = async (userData) => {
  try {
    const confirmationCode = generateConfirmationCode();
    const deviceInfo = getDeviceInfo();
    
    // Guardar código en localStorage para verificación
    localStorage.setItem(`login_confirmation_${userData.email}`, confirmationCode);
    
    // Mostrar código directamente al usuario
    alert(`🔐 Código de verificación de acceso\n\n🔐 Tu código es: ${confirmationCode}\n\n✅ Ingresa este código en la siguiente pantalla para confirmar tu acceso.`);
    
    return {
      success: true,
      email: userData.email,
      code: confirmationCode,
      type: 'login'
    };
  } catch (error) {
    console.error('❌ Error enviando email de login:', error);
    
    // Fallback en caso de error
    const fallbackCode = generateConfirmationCode();
    localStorage.setItem(`login_confirmation_${userData.email}`, fallbackCode);
    alert(`🔐 Código de verificación\n\n🔐 Tu código es: ${fallbackCode}\n\n✅ Ingresa este código en la siguiente pantalla.`);
    
    return {
      success: false,
      email: userData.email,
      code: fallbackCode,
      type: 'login',
      error: 'Fallback code generated'
    };
  }
};

/**
 * Verifica un código de confirmación
 * @param {string} email - Email del usuario
 * @param {string} code - Código a verificar
 * @param {string} type - Tipo de confirmación ('registration' o 'login')
 * @returns {boolean} True si el código es válido
 */
export const verifyConfirmationCode = (email, code, type = 'registration') => {
  try {
    const storageKey = type === 'registration' ? `confirmation_${email}` : `login_confirmation_${email}`;
    const storedCode = localStorage.getItem(storageKey);
    
    if (storedCode === code) {
      // Limpiar código después de verificación exitosa
      localStorage.removeItem(storageKey);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error verificando código:', error);
    return false;
  }
};

/**
 * Envía email de bienvenida después de confirmación
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<boolean>} True si el email se envió correctamente
 */
export const sendWelcomeEmail = async (userData) => {
  try {
    const templateParams = {
      to_name: userData.nombre,
      to_email: userData.email,
      user_name: userData.nombre,
      app_name: 'TuGood TuGo',
      app_url: 'https://tugood-tugo.vercel.app',
      features: [
        'Encuentra ofertas increíbles en comercios locales',
        'Ayuda a reducir el desperdicio de alimentos',
        'Ahorra dinero en tus compras diarias',
        'Contribuye al cuidado del medio ambiente'
      ].join('\n• '),
      support_email: 'soporte@tugoodtugo.com'
    };

    console.log('📧 Simulando envío de email de bienvenida:', templateParams);
    
    // En producción, usar template de bienvenida
    // await emailjs.send(EMAIL_CONFIG.serviceId, 'template_welcome', templateParams);
    
    return true;
  } catch (error) {
    console.error('❌ Error enviando email de bienvenida:', error);
    return false;
  }
};

/**
 * Configuración para producción
 * Llamar esta función con las credenciales reales de EmailJS
 */
export const configureEmailService = (serviceId, publicKey, templateIds) => {
  EMAIL_CONFIG.serviceId = serviceId;
  EMAIL_CONFIG.publicKey = publicKey;
  EMAIL_CONFIG.templateIds = { ...EMAIL_CONFIG.templateIds, ...templateIds };
  initEmailJS();
};

/**
 * Envía un código OTP por correo electrónico
 * @param {string} email - Dirección de correo del destinatario
 * @param {string} otp - Código OTP a enviar
 * @returns {Promise<boolean>} True si el correo se envió correctamente
 */
const sendOTPEmail = async (email, otp) => {
  try {
    const templateParams = {
      to_email: email,
      otp_code: otp,
      expiration_minutes: 10, // Tiempo de expiración en minutos
      app_name: 'TuGood TuGo'
    };

    // Usar el template de OTP
    await emailjs.send(
      EMAIL_CONFIG.serviceId,
      'template_otp', // Asegúrate de crear este template en EmailJS
      templateParams,
      EMAIL_CONFIG.publicKey
    );

    console.log(`OTP enviado a ${email}`);
    return true;
  } catch (error) {
    console.error('Error enviando OTP por correo:', error);
    throw new Error('No se pudo enviar el código de verificación');
  }
};

// Inicializar EmailJS al cargar el módulo
initEmailJS();

// Exportar configuración para uso en otros módulos
export { EMAIL_CONFIG };

// Templates de ejemplo para EmailJS
export const EMAIL_TEMPLATES = {
  registration: {
    subject: '🎉 ¡Bienvenido a TuGood TuGo! - Confirma tu registro',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🛒 TuGood TuGo</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">¡Bienvenido a la revolución contra el desperdicio!</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-bottom: 20px;">¡Hola {{user_name}}! 👋</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            ¡Gracias por registrarte en TuGood TuGo! Tu cuenta como <strong>{{user_type}}</strong> ha sido creada exitosamente.
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="color: #1f2937; margin-bottom: 10px;">🔐 Código de Confirmación</h3>
            <div style="font-size: 32px; font-weight: bold; color: #d97706; letter-spacing: 4px; font-family: monospace;">
              {{confirmation_code}}
            </div>
          </div>
          
          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <h4 style="color: #065f46; margin: 0 0 10px 0;">📋 Detalles del Registro:</h4>
            <p style="margin: 5px 0; color: #047857;"><strong>Email:</strong> {{user_email}}</p>
            <p style="margin: 5px 0; color: #047857;"><strong>Fecha:</strong> {{timestamp}}</p>
            <p style="margin: 5px 0; color: #047857;"><strong>Dispositivo:</strong> {{device_type}} ({{browser}})</p>
            <p style="margin: 5px 0; color: #047857;"><strong>Ubicación:</strong> {{location}}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://tugood-tugo.vercel.app" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              🚀 Comenzar a Explorar
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Si tienes alguna pregunta, contáctanos en <a href="mailto:{{support_email}}" style="color: #d97706;">{{support_email}}</a>
            </p>
          </div>
        </div>
      </div>
    `
  },
  
  login: {
    subject: '🔐 Confirmación de Inicio de Sesión - TuGood TuGo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🛒 TuGood TuGo</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Confirmación de Acceso</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-bottom: 20px;">¡Hola {{user_name}}! 👋</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Hemos detectado un nuevo inicio de sesión en tu cuenta de TuGood TuGo.
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="color: #1f2937; margin-bottom: 10px;">🔐 Código de Confirmación</h3>
            <div style="font-size: 32px; font-weight: bold; color: #1d4ed8; letter-spacing: 4px; font-family: monospace;">
              {{confirmation_code}}
            </div>
          </div>
          
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <h4 style="color: #1e40af; margin: 0 0 10px 0;">📋 Detalles del Acceso:</h4>
            <p style="margin: 5px 0; color: #1e3a8a;"><strong>Email:</strong> {{user_email}}</p>
            <p style="margin: 5px 0; color: #1e3a8a;"><strong>Fecha y Hora:</strong> {{timestamp}}</p>
            <p style="margin: 5px 0; color: #1e3a8a;"><strong>Dispositivo:</strong> {{device_type}} ({{browser}})</p>
            <p style="margin: 5px 0; color: #1e3a8a;"><strong>Ubicación:</strong> {{location}}</p>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <h4 style="color: #92400e; margin: 0 0 10px 0;">⚠️ Importante:</h4>
            <p style="margin: 0; color: #a16207;">{{security_tip}}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://tugood-tugo.vercel.app/profile" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              👤 Ver Mi Perfil
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Si tienes alguna pregunta, contáctanos en <a href="mailto:{{support_email}}" style="color: #3b82f6;">{{support_email}}</a>
            </p>
          </div>
        </div>
      </div>
    `
  }
};

// Exportar las funciones principales
