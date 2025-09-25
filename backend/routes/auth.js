const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generar JWT token
const generateToken = (userId, email, rol) => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET no está definido en las variables de entorno');
    throw new Error('Error de configuración del servidor');
  }
  
  return jwt.sign(
    { userId, email, rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register - Registro de usuario
router.post('/register', [
  body('nombre').trim().isLength({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('rol').isIn(['cliente', 'comercio']).withMessage('Rol debe ser cliente o comercio'),
  body('telefono').optional().isMobilePhone('es-CO').withMessage('Teléfono inválido para Colombia')
], async (req, res) => {
  try {
    console.log('Solicitud de registro recibida');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Errores de validación:', errors.array());
      return res.status(400).json({ 
        success: false,
        error: 'Datos inválidos',
        details: errors.array() 
      });
    }

    const { nombre, email, password, rol, telefono } = req.body;
    
    console.log('Procesando registro para:', { email, rol });

    try {
      // Verificar si el email ya existe
      console.log('Verificando si el email ya existe:', email);
      const existingUser = await query('SELECT id FROM usuarios WHERE email = $1', [email]);
      
      if (existingUser.rows.length > 0) {
        console.log('El email ya está registrado:', email);
        return res.status(409).json({ 
          success: false,
          error: 'El email ya está registrado',
          message: 'Ya existe una cuenta con este correo electrónico'
        });
      }

      // Hash password
      console.log('Generando hash de la contraseña...');
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      try {
        // Crear usuario
        console.log('Insertando nuevo usuario en la base de datos...');
        const db = require('../config/database');
        
        // Insertar el usuario
        await db.query(
          `INSERT INTO usuarios (nombre, email, password_hash, rol, telefono, activo, fecha_registro)
           VALUES (?, ?, ?, ?, ?, 1, datetime('now'))`,
          [nombre, email, passwordHash, rol, telefono]
        );

        // Obtener el ID del usuario insertado
        console.log('DEBUG: Ejecutando last_insert_rowid()...');
        const lastIdResult = await db.query('SELECT last_insert_rowid() as id');
        console.log('DEBUG: lastIdResult:', JSON.stringify(lastIdResult, null, 2));
        
        // Obtener el ID del resultado
        const userId = lastIdResult?.rows?.[0]?.id;
        
        console.log('DEBUG: ID extraído:', userId);
        
        if (!userId) {
          throw new Error(`❌ No se pudo obtener el ID del usuario. Respuesta DB: ${JSON.stringify(lastIdResult)}`);
        }
        console.log('Usuario creado exitosamente con ID:', userId);

        // Obtenemos los datos del usuario recién creado
        const userResult = await db.query(
          'SELECT id, nombre, email, rol, telefono, fecha_registro FROM usuarios WHERE id = ?',
          [userId]
        );
        const user = userResult?.rows?.[0] || userResult?.[0] || userResult;

        // Si es comercio, crear registro en la tabla comercios
        let comercioInfo = null;
        if (rol === 'comercio') {
          console.log('Creando registro de comercio para el usuario:', userId);
          
          // Insertar el comercio
          const comercioInsert = await db.query(
            `INSERT INTO comercios (usuario_id, nombre, verificado)
             VALUES (?, ?, 0)`,
            [userId, nombre]
          );
          
          // Obtener el ID del comercio insertado
          console.log('DEBUG: Obteniendo ID del comercio...');
          const comercioLastId = await db.query('SELECT last_insert_rowid() as id');
          console.log('DEBUG: comercioLastId:', JSON.stringify(comercioLastId, null, 2));
          
          const comercioId = comercioLastId?.rows?.[0]?.id;
          
          console.log('DEBUG: ID de comercio extraído:', comercioId);
          
          if (!comercioId) {
            throw new Error(`❌ No se pudo obtener el ID del comercio. Respuesta DB: ${JSON.stringify(comercioLastId)}`);
          }
          
          // Obtener los datos del comercio recién creado
          const comercioResult = await db.query(
            'SELECT id, nombre, verificado FROM comercios WHERE id = ?',
            [comercioId]
          );
          
          comercioInfo = comercioResult[0]; // Get the first row from the result
          console.log('Comercio creado exitosamente:', comercioInfo);
        }

        // Generar token JWT
        console.log('Generando token JWT...');
        const token = generateToken(user.id, user.email, user.rol);
        
        if (!token) {
          throw new Error('No se pudo generar el token de autenticación');
        }

        console.log('Usuario registrado exitosamente');
        
        // Preparar respuesta
        const responseData = {
          success: true,
          message: 'Usuario registrado exitosamente',
          user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            telefono: user.telefono,
            fechaRegistro: user.fecha_registro,
            comercio: comercioInfo
          },
          token
        };

        console.log('Enviando respuesta de registro exitoso');
        return res.status(201).json(responseData);

      } catch (error) {
        console.error('Error durante el registro:', error);
        throw error;
      }

    } catch (error) {
      console.error('Error en el proceso de registro:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error en el controlador de registro:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'No se pudo completar el registro. Por favor, inténtalo de nuevo más tarde.'
    });
  }
});

// POST /api/auth/login - Login de usuario
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
], async (req, res) => {
  console.log('\n=== SOLICITUD DE LOGIN RECIBIDA ===');
  console.log('Hora:', new Date().toISOString());
  console.log('Datos recibidos:', { email: req.body.email });
  
  try {
    // Validar datos de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Errores de validación:', errors.array());
      return res.status(400).json({ 
        success: false,
        error: 'Datos inválidos',
        details: errors.array() 
      });
    }

    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('❌ Email o contraseña faltantes');
      return res.status(400).json({ 
        success: false,
        error: 'Datos incompletos',
        message: 'Email y contraseña son requeridos' 
      });
    }

    try {
      // Buscar usuario en la base de datos
      console.log('🔍 Buscando usuario con email:', email);
      const result = await query(
        `SELECT id, nombre, email, password_hash, rol, activo, telefono, fecha_registro 
         FROM usuarios 
         WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        console.log('❌ Usuario no encontrado para el email:', email);
        return res.status(401).json({ 
          success: false,
          error: 'Credenciales inválidas',
          message: 'No existe una cuenta con este correo electrónico'
        });
      }

      const user = result.rows[0];
      console.log('✅ Usuario encontrado:', { 
        id: user.id, 
        email: user.email, 
        rol: user.rol,
        activo: user.activo,
        tieneGoogleId: !!user.google_id
      });

      // Verificar si la cuenta está activa
      if (!user.activo) {
        console.log('❌ Intento de inicio de sesión para cuenta inactiva:', user.email);
        return res.status(403).json({ 
          success: false,
          error: 'Cuenta inactiva',
          message: 'Tu cuenta ha sido desactivada. Por favor, contacta al soporte.'
        });
      }

      // Si el usuario tiene google_id, redirigir a autenticación con Google
      if (user.google_id) {
        console.log('ℹ️  Este email está registrado con Google. Redirigiendo...');
        return res.status(400).json({
          success: false,
          error: 'Autenticación requerida',
          message: 'Este correo está registrado con Google. Por favor, inicia sesión con Google.',
          authMethod: 'google'
        });
      }

      // Verificar contraseña
      console.log('🔐 Verificando contraseña...');
      const validPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!validPassword) {
        console.log('❌ Contraseña incorrecta para el usuario:', user.email);
        return res.status(401).json({ 
          success: false,
          error: 'Credenciales inválidas',
          message: 'La contraseña es incorrecta'
        });
      }

      // Generar token JWT
      console.log('🔑 Generando token JWT...');
      const token = generateToken(user.id, user.email, user.rol);
      
      if (!token) {
        console.error('❌ Error al generar el token para el usuario:', user.id);
        return res.status(500).json({ 
          success: false,
          error: 'Error interno',
          message: 'No se pudo generar el token de autenticación'
        });
      }

      // Si es comercio, obtener información adicional
      let comercioInfo = null;
      if (user.rol === 'comercio') {
        console.log('🏪 Buscando información del comercio para el usuario:', user.id);
        const comercioResult = await query(
          `SELECT id, nombre, verificado, direccion, telefono, horario, 
                  descripcion, calificacion_promedio, imagen_url, zona_id
           FROM comercios 
           WHERE usuario_id = $1`,
          [user.id]
        );
        comercioInfo = comercioResult.rows[0];
        console.log('🏪 Información del comercio encontrada:', 
          comercioInfo ? 'Sí' : 'No', 
          comercioInfo || ''
        );
      }

      // Preparar respuesta exitosa
      const userResponse = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        telefono: user.telefono,
        avatarUrl: user.avatar_url,
        fechaRegistro: user.fecha_registro,
        comercio: comercioInfo
      };

      console.log('✅ Login exitoso para el usuario:', user.email);
      console.log('📋 Datos del usuario:', {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol,
        tieneComercio: !!comercioInfo
      });

      res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        token: token,
        user: userResponse
      });

    } catch (error) {
      console.error('❌ Error durante el proceso de login:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'Ocurrió un error al procesar la solicitud de inicio de sesión',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    console.error('❌ Error en el controlador de login:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'No se pudo procesar la solicitud de inicio de sesión',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    console.log('=== FIN DE LA SOLICITUD DE LOGIN ===\n');
  }
});

// POST /api/auth/google - Login con Google OAuth
router.post('/google', [
  body('googleId').notEmpty().withMessage('Google ID requerido'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('nombre').trim().isLength({ min: 1 }).withMessage('Nombre requerido')
], async (req, res) => {
  console.log('\n=== SOLICITUD DE LOGIN CON GOOGLE RECIBIDA ===');
  console.log('Hora:', new Date().toISOString());
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Errores de validación:', errors.array());
      return res.status(400).json({ 
        success: false,
        error: 'Datos inválidos', 
        details: errors.array() 
      });
    }

    const { googleId, email, nombre, avatar } = req.body;
    console.log('Procesando autenticación de Google para:', { email, googleId });

    const client = await require('../config/database').getClient();
    
    try {
      await client.query('BEGIN');

      // Buscar usuario existente por google_id o email
      console.log('🔍 Buscando usuario existente...');
      const result = await client.query(
        `SELECT id, nombre, email, rol, activo, google_id, avatar_url 
         FROM usuarios 
         WHERE google_id = $1 OR email = $2`,
        [googleId, email]
      );

      let user;
      let isNewUser = false;

      if (result.rows.length === 0) {
        // Crear nuevo usuario
        console.log('👤 Creando nuevo usuario con Google...');
        const insertResult = await client.query(
          `INSERT INTO usuarios (nombre, email, password_hash, rol, google_id, avatar_url, activo) 
           VALUES ($1, $2, $3, $4, $5, $6, true) 
           RETURNING id, nombre, email, rol, telefono, fecha_registro, avatar_url`,
          [nombre, email, 'google_oauth', 'cliente', googleId, avatar || null]
        );
        
        user = insertResult.rows[0];
        isNewUser = true;
        console.log('✅ Nuevo usuario creado con Google:', { id: user.id, email: user.email });
      } else {
        // Usuario existente
        user = result.rows[0];
        console.log('✅ Usuario existente encontrado:', { id: user.id, email: user.email });
        
        // Actualizar google_id si no existe
        if (!user.google_id) {
          console.log('🔄 Actualizando google_id para el usuario existente...');
          await client.query(
            'UPDATE usuarios SET google_id = $1, activo = true WHERE id = $2',
            [googleId, user.id]
          );
          user.google_id = googleId;
        }

        // Actualizar avatar si es necesario
        if (avatar && (!user.avatar_url || user.avatar_url !== avatar)) {
          console.log('🔄 Actualizando avatar del usuario...');
          await client.query(
            'UPDATE usuarios SET avatar_url = $1 WHERE id = $2',
            [avatar, user.id]
          );
          user.avatar_url = avatar;
        }
      }

      // Verificar si la cuenta está activa
      if (!user.activo) {
        console.log('❌ Intento de inicio de sesión para cuenta inactiva:', user.email);
        await client.query('ROLLBACK');
        return res.status(403).json({ 
          success: false,
          error: 'Cuenta inactiva',
          message: 'Tu cuenta ha sido desactivada. Por favor, contacta al soporte.'
        });
      }

      // Generar token JWT
      console.log('🔑 Generando token JWT...');
      const token = generateToken(user.id, user.email, user.rol);
      
      if (!token) {
        throw new Error('No se pudo generar el token de autenticación');
      }

      // Confirmar transacción
      await client.query('COMMIT');
      console.log('✅ Transacción completada con éxito');

      // Preparar respuesta
      const responseData = {
        success: true,
        message: isNewUser ? '¡Bienvenido a TuGood TuGo!' : '¡Bienvenido de nuevo!',
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          telefono: user.telefono,
          avatarUrl: user.avatar_url,
          fechaRegistro: user.fecha_registro
        },
        token,
        isNewUser
      };

      console.log('✅ Autenticación con Google exitosa para:', user.email);
      return res.json(responseData);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error durante la transacción de Google OAuth:', error);
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error en el controlador de Google OAuth:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'No se pudo completar la autenticación con Google',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    console.log('=== FIN DE LA SOLICITUD DE LOGIN CON GOOGLE ===\n');
  }
});

// GET /api/auth/me - Obtener información del usuario autenticado
router.get('/me', authenticateToken, async (req, res) => {
  console.log('\n=== SOLICITUD DE PERFIL DE USUARIO ===');
  console.log('Hora:', new Date().toISOString());
  console.log('Usuario autenticado:', { id: req.user.id, email: req.user.email });
  
  try {
    const userId = req.user.id;

    console.log('🔍 Buscando información del usuario...');
    const result = await query(
      `SELECT u.id, u.nombre, u.email, u.rol, u.telefono, u.avatar_url, u.fecha_registro,
              c.id as comercio_id, c.nombre as comercio_nombre, c.verificado,
              c.direccion, c.telefono as comercio_telefono, c.horario,
              c.descripcion, c.calificacion_promedio, c.imagen_url, c.zona_id
       FROM usuarios u
       LEFT JOIN comercios c ON u.id = c.usuario_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        telefono: user.telefono,
        avatar: user.avatar_url,
        fechaRegistro: user.fecha_registro,
        comercio: user.comercio_id ? {
          id: user.comercio_id,
          nombre: user.comercio_nombre,
          verificado: user.verificado
        } : null
      }
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/refresh - Renovar token
router.post('/refresh', authenticateToken, (req, res) => {
  try {
    const { id, email, rol } = req.user;
    const newToken = generateToken(id, email, rol);

    res.json({
      message: 'Token renovado',
      token: newToken
    });

  } catch (error) {
    console.error('Error renovando token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
