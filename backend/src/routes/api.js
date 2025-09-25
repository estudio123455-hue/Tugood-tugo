import express from 'express';
import { authenticateToken, checkRole } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../config/database.js';

const router = express.Router();

/**
 * @route   GET /api/
 * @desc    Ruta de bienvenida de la API
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenido a la API de TuGood',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   POST /api/login
 * @desc    Iniciar sesión de usuario
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar datos de entrada
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, proporcione correo electrónico y contraseña'
      });
    }

    // Buscar usuario en la base de datos
    const user = await query('SELECT * FROM usuarios WHERE email = ?', [email]);
    
    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user[0].password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Crear token JWT
    const token = jwt.sign(
      { 
        id: user[0].id, 
        email: user[0].email, 
        rol: user[0].rol 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Devolver datos del usuario (sin la contraseña) y el token
    const { password_hash, ...userData } = user[0];
    
    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor al iniciar sesión',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Privado
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await query('SELECT id, nombre, email, telefono, rol FROM usuarios WHERE id = ?', [userId]);
    
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      user: user[0]
    });
    
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el perfil del usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/check-auth
 * @desc    Verificar si el token es válido
 * @access  Privado
 */
router.get('/check-auth', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token válido',
    user: {
      id: req.user.id,
      email: req.user.email,
      rol: req.user.rol
    }
  });
});

export default router;
