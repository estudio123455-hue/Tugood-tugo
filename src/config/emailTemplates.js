// Plantillas de correo electrónico para la aplicación

export const EMAIL_TEMPLATES = {
  registration: {
    subject: '🎉 ¡Bienvenido a TuGood TuGo! - Confirma tu registro',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">¡Bienvenido a TuGood TuGo!</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">Confirma tu correo electrónico</h2>
          <p>Hola {{name}},</p>
          <p>Gracias por registrarte en TuGood TuGo. Para completar tu registro, por favor utiliza el siguiente código de verificación:</p>
          
          <div style="background: #f1f5f9; padding: 15px; text-align: center; margin: 25px 0; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
            {{otp_code}}
          </div>
          
          <p>Este código expirará en 10 minutos.</p>
          
          <p>Si no has solicitado este registro, puedes ignorar este mensaje.</p>
          
          <p>¡Gracias!<br>El equipo de TuGood TuGo</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </div>
    `
  },
  login: {
    subject: '🔐 Inicio de sesión detectado - TuGood TuGo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Inicio de sesión detectado</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">Confirmación de inicio de sesión</h2>
          <p>Hola {{name}},</p>
          <p>Se ha detectado un inicio de sesión en tu cuenta de TuGood TuGo. Si has sido tú, puedes ignorar este mensaje.</p>
          
          <div style="background: #f1f5f9; padding: 15px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; font-weight: bold;">Detalles del inicio de sesión:</p>
            <p style="margin: 5px 0;">📅 Fecha: {{date}}</p>
            <p style="margin: 5px 0;">🌍 Ubicación: {{location}}</p>
            <p style="margin: 5px 0;">💻 Dispositivo: {{device}}</p>
          </div>
          
          <p>Si no reconoces esta actividad, por favor cambia tu contraseña de inmediato y contáctanos.</p>
          
          <p>Saludos,<br>El equipo de TuGood TuGo</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </div>
    `
  },
  otp: {
    subject: '🔑 Tu código de verificación - TuGood TuGo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Código de verificación</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">Tu código de seguridad</h2>
          <p>Hola,</p>
          <p>Hemos recibido una solicitud para acceder a tu cuenta de TuGood TuGo. Utiliza el siguiente código para continuar:</p>
          
          <div style="background: #f1f5f9; padding: 15px; text-align: center; margin: 25px 0; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 3px; color: #065f46;">
            {{otp_code}}
          </div>
          
          <p>Este código es válido por {{expiration_minutes}} minutos y solo puede usarse una vez.</p>
          
          <p>Si no has solicitado este código, por favor ignora este mensaje o contáctanos si tienes alguna duda.</p>
          
          <p>Gracias,<br>El equipo de TuGood TuGo</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </div>
    `
  }
};

export default EMAIL_TEMPLATES;
