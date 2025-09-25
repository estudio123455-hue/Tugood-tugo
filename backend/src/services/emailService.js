import nodemailer from 'nodemailer';

// Configuración del transporte de correo
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  // Habilitar el modo de depuración
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development',
});

// Verificar la configuración del transporte
transporter.verify(function(error, success) {
  if (error) {
    console.error('Error en la configuración del transporte de correo:', error);
  } else {
    console.log('Servidor de correo configurado correctamente');
  }
});

/**
 * Envía un correo electrónico con un código OTP
 * @param {string} to - Dirección de correo del destinatario
 * @param {string} otp - Código OTP a enviar
 * @returns {Promise<{success: boolean, error?: string}>} - Resultado del envío
 */
export const sendOTPEmail = async (to, otp) => {
  try {
    console.log(`Intentando enviar correo a: ${to}`);
    console.log(`Usando la cuenta de correo: ${process.env.EMAIL_USER}`);
    
    // Validar el correo de destino
    if (!to || !to.includes('@')) {
      console.error('Dirección de correo no válida:', to);
      return { success: false, error: 'Dirección de correo no válida' };
    }

    // Configuración del correo
    const mailOptions = {
      from: `"TuGood TuGo" <${process.env.EMAIL_USER}>`,
      to: to, // Usar el correo proporcionado por el usuario
      subject: '🔑 Tu Código de Verificación - TuGood TuGo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #4F46E5; padding: 20px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1>Tu Código de Verificación</h1>
          </div>
          <div style="padding: 30px; background: #ffffff; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p>Hola,</p>
            <p>Tu código de verificación para acceder a TuGood TuGo es:</p>
            <div style="background: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px;">
              ${otp}
            </div>
            <p>Este código es válido por 10 minutos. No lo compartas con nadie.</p>
            <p>Si no has solicitado este código, puedes ignorar este mensaje.</p>
            <p>¡Gracias por usar TuGood TuGo!</p>
            <p>El equipo de TuGood TuGo</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #9e9e9e; font-size: 12px;">
            <p>© ${new Date().getFullYear()} TuGood TuGo. Todos los derechos reservados.</p>
          </div>
        </div>
      `,
    };

    // Enviar el correo
    const info = await transporter.sendMail(mailOptions);
    console.log('Mensaje enviado:', info.messageId);
    console.log(`Correo de verificación enviado a: ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Error al enviar el correo de verificación:', error);
    return { 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};

export default {
  sendOTPEmail,
};
