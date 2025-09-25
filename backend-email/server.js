const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'https://tugood-tugo-pszg26l50-estudio123455-hues-projects.vercel.app',
    'https://tugood-tugo.vercel.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Configurar Nodemailer con Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Tu email de Gmail
    pass: process.env.EMAIL_PASS  // App Password de Gmail
  }
});

// Función para generar código de verificación
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Endpoint para enviar email de registro
app.post('/api/send-registration-email', async (req, res) => {
  try {
    console.log('📧 Recibida solicitud de email:', req.body);
    const { nombre, email, deviceInfo } = req.body;
    
    if (!nombre || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y email son requeridos'
      });
    }
    
    const verificationCode = generateVerificationCode();
    console.log('🔐 Código generado:', verificationCode);
    
    const mailOptions = {
      from: `"TuGood TuGo" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 ¡Bienvenido a TuGood TuGo! - Confirma tu registro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🛒 TuGood TuGo</h1>
            <p style="color: white; margin: 10px 0 0 0;">¡Bienvenido a la revolución contra el desperdicio!</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937;">¡Hola ${nombre}! 👋</h2>
            <p style="color: #4b5563;">¡Gracias por registrarte en TuGood TuGo!</p>
            
            <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h3 style="color: #1f2937;">🔐 Código de Confirmación</h3>
              <div style="font-size: 32px; font-weight: bold; color: #d97706; letter-spacing: 4px; font-family: monospace;">
                ${verificationCode}
              </div>
            </div>
            
            <p style="color: #4b5563;">Ingresa este código en la aplicación para completar tu registro.</p>
            <p style="color: #6b7280; font-size: 14px;">Email: ${email}</p>
            <p style="color: #6b7280; font-size: 14px;">Dispositivo: ${deviceInfo?.deviceType || 'Desconocido'}</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; text-align: center;">
                Si tienes alguna pregunta, contáctanos en soporte@tugoodtugo.com
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'Email enviado exitosamente',
      verificationCode: verificationCode
    });
    
  } catch (error) {
    console.error('Error enviando email:', error);
    res.status(500).json({
      success: false,
      message: 'Error enviando email',
      error: error.message
    });
  }
});

// Endpoint para enviar email de login
app.post('/api/send-login-email', async (req, res) => {
  try {
    const { nombre, email, deviceInfo } = req.body;
    const verificationCode = generateVerificationCode();
    
    const mailOptions = {
      from: `"TuGood TuGo" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Confirmación de Inicio de Sesión - TuGood TuGo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🛒 TuGood TuGo</h1>
            <p style="color: white; margin: 10px 0 0 0;">Confirmación de Acceso</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937;">¡Hola ${nombre}! 👋</h2>
            <p style="color: #4b5563;">Hemos detectado un nuevo inicio de sesión en tu cuenta.</p>
            
            <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h3 style="color: #1f2937;">🔐 Código de Confirmación</h3>
              <div style="font-size: 32px; font-weight: bold; color: #1d4ed8; letter-spacing: 4px; font-family: monospace;">
                ${verificationCode}
              </div>
            </div>
            
            <p style="color: #4b5563;">Ingresa este código para confirmar tu acceso.</p>
            <p style="color: #6b7280; font-size: 14px;">Email: ${email}</p>
            <p style="color: #6b7280; font-size: 14px;">Dispositivo: ${deviceInfo?.deviceType || 'Desconocido'}</p>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #a16207;">⚠️ Si no fuiste tú quien inició sesión, cambia tu contraseña inmediatamente.</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; text-align: center;">
                Si tienes alguna pregunta, contáctanos en soporte@tugoodtugo.com
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'Email enviado exitosamente',
      verificationCode: verificationCode
    });
    
  } catch (error) {
    console.error('Error enviando email:', error);
    res.status(500).json({
      success: false,
      message: 'Error enviando email',
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Email service running',
    timestamp: new Date().toISOString(),
    env: {
      EMAIL_USER: process.env.EMAIL_USER ? 'configured' : 'missing',
      EMAIL_PASS: process.env.EMAIL_PASS ? 'configured' : 'missing'
    }
  });
});

// Test endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'TuGood TuGo Email Backend',
    status: 'running',
    endpoints: [
      'GET /api/health',
      'POST /api/send-registration-email',
      'POST /api/send-login-email'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Email server running on port ${PORT}`);
});
