const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/profile - Obtener perfil del usuario autenticado
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('Solicitud de perfil recibida para el usuario:', req.user);
    const userId = req.user.id;

    // Verificar si el token es válido
    if (!userId) {
      console.error('ID de usuario no encontrado en el token');
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    try {
      // Primero verificar si el usuario existe
      const userCheck = await query('SELECT id FROM usuarios WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        console.error(`Usuario con ID ${userId} no encontrado`);
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      console.log(`Buscando perfil para el usuario ID: ${userId}`);
      const result = await query(`
        SELECT u.id, u.nombre, u.email, u.rol, u.telefono, u.avatar_url, u.fecha_registro,
               c.id as comercio_id, c.nombre as comercio_nombre, c.verificado,
               conf.notificaciones_push, conf.notificaciones_email, conf.zona_preferida,
               conf.radio_busqueda, conf.tipos_comida_preferidos
        FROM usuarios u
        LEFT JOIN comercios c ON u.id = c.usuario_id
        LEFT JOIN configuraciones_usuario conf ON u.id = conf.usuario_id
        WHERE u.id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        console.error(`No se encontró perfil para el usuario ID: ${userId}`);
        return res.status(404).json({ error: 'Perfil no encontrado' });
      }

      const user = result.rows[0];
      console.log(`Perfil encontrado para el usuario: ${user.email}`);

      res.json({
        usuario: {
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
          } : null,
          configuraciones: {
            notificacionesPush: user.notificaciones_push ?? true,
            notificacionesEmail: user.notificaciones_email ?? true,
            zonaPreferida: user.zona_preferida,
            radioBusqueda: user.radio_busqueda ?? 5,
            tiposComidaPreferidos: user.tipos_comida_preferidos ?? []
          }
        }
      });

    } catch (dbError) {
      console.error('Error de base de datos:', {
        message: dbError.message,
        query: dbError.query,
        parameters: dbError.parameters,
        stack: dbError.stack
      });
      throw dbError; // Esto será capturado por el catch externo
    }

  } catch (error) {
    console.error('Error obteniendo perfil:', {
      message: error.message,
      stack: error.stack,
      user: req.user
    });
    
    // Mensaje de error más detallado
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Error del servidor: ${error.message}`
      : 'Error al cargar el perfil. Por favor, intenta de nuevo más tarde.';
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PUT /api/users/profile - Actualizar perfil del usuario
router.put('/profile', [
  authenticateToken,
  body('nombre').optional().trim().isLength({ min: 2, max: 100 }),
  body('telefono')
    .optional({ checkFalsy: true }) // Acepta null, undefined o ""
    .custom((value) => {
      // Si el valor está vacío, se considera válido
      if (!value || value.trim() === '') {
        return true;
      }
      // Si hay un valor, debe ser un teléfono válido
      return /^[0-9+\s-]{6,20}$/.test(value);
    })
    .withMessage('El teléfono debe ser un número válido'),
  body('avatar_url').optional().isURL()
], async (req, res) => {
  console.log('📩 Solicitud de actualización de perfil recibida');
  console.log('🔑 Usuario autenticado ID:', req.user.id);
  console.log('📦 Cuerpo de la solicitud:', JSON.stringify(req.body, null, 2));
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Errores de validación:', errors.array());
      return res.status(400).json({ 
        error: 'Datos inválidos', 
        details: errors.array() 
      });
    }

    const userId = req.user.id;
    const updates = req.body;
    
    console.log('🔄 Campos a actualizar:', Object.keys(updates));
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    if (fields.length === 0) {
      console.error('❌ No hay campos para actualizar');
      return res.status(400).json({ 
        error: 'No hay campos para actualizar',
        details: 'Se requieren campos para actualizar el perfil'
      });
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    values.push(userId);

    console.log('🛠️  Construyendo consulta SQL con:', { setClause, values });

    try {
      const result = await query(`
        UPDATE usuarios 
        SET ${setClause}
        WHERE id = $${values.length}
        RETURNING id, nombre, email, rol, telefono, avatar_url, fecha_registro
      `, values);

      if (result.rows.length === 0) {
        console.error('❌ Usuario no encontrado');
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      console.log('✅ Perfil actualizado exitosamente');
      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        user: result.rows[0]
      });

    } catch (dbError) {
      console.error('❌ Error en la consulta SQL:', {
        message: dbError.message,
        query: dbError.query,
        parameters: dbError.parameters,
        stack: dbError.stack
      });
      throw dbError;
    }

  } catch (error) {
    console.error('❌ Error en el controlador de actualización de perfil:', {
      message: error.message,
      stack: error.stack,
      user: req.user
    });
    
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Error del servidor: ${error.message}`
      : 'Error al actualizar el perfil. Por favor, intenta de nuevo más tarde.';
    
    res.status(500).json({ 
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PUT /api/users/configuraciones - Actualizar configuraciones del usuario
router.put('/configuraciones', [
  authenticateToken,
  body('notificacionesPush').optional().isBoolean(),
  body('notificacionesEmail').optional().isBoolean(),
  body('zonaPreferida').optional().isIn(['Chapinero','Usaquén','Teusaquillo','Kennedy','Zona Rosa','La Candelaria','Suba','Engativá']),
  body('radioBusqueda').optional().isInt({ min: 1, max: 50 }),
  body('tiposComidaPreferidos').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos inválidos', details: errors.array() });
    }

    const userId = req.user.id;
    const {
      notificacionesPush,
      notificacionesEmail,
      zonaPreferida,
      radioBusqueda,
      tiposComidaPreferidos
    } = req.body;

    // Verificar si ya existe configuración
    const existingConfig = await query(
      'SELECT id FROM configuraciones_usuario WHERE usuario_id = $1',
      [userId]
    );

    let result;
    if (existingConfig.rows.length === 0) {
      // Crear nueva configuración
      result = await query(`
        INSERT INTO configuraciones_usuario 
        (usuario_id, notificaciones_push, notificaciones_email, zona_preferida, radio_busqueda, tipos_comida_preferidos)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [userId, notificacionesPush, notificacionesEmail, zonaPreferida, radioBusqueda, tiposComidaPreferidos]);
    } else {
      // Actualizar configuración existente
      const updates = {};
      if (notificacionesPush !== undefined) updates.notificaciones_push = notificacionesPush;
      if (notificacionesEmail !== undefined) updates.notificaciones_email = notificacionesEmail;
      if (zonaPreferida !== undefined) updates.zona_preferida = zonaPreferida;
      if (radioBusqueda !== undefined) updates.radio_busqueda = radioBusqueda;
      if (tiposComidaPreferidos !== undefined) updates.tipos_comida_preferidos = tiposComidaPreferidos;

      const fields = Object.keys(updates);
      const values = Object.values(updates);
      
      if (fields.length === 0) {
        return res.status(400).json({ error: 'No hay campos para actualizar' });
      }

      const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
      values.push(userId);

      result = await query(`
        UPDATE configuraciones_usuario 
        SET ${setClause}
        WHERE usuario_id = $${values.length}
        RETURNING *
      `, values);
    }

    res.json({
      message: 'Configuraciones actualizadas exitosamente',
      configuraciones: result.rows[0]
    });

  } catch (error) {
    console.error('Error actualizando configuraciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/users/favoritos - Obtener comercios favoritos
router.get('/favoritos', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT c.id, c.nombre, c.direccion, c.zona_bogota, c.tipo_comercio,
             c.rating, c.imagen_url, f.fecha_agregado,
             COUNT(p.id) as packs_activos
      FROM favoritos f
      JOIN comercios c ON f.comercio_id = c.id
      LEFT JOIN packs p ON c.id = p.comercio_id AND p.activo = true
      WHERE f.usuario_id = $1
      GROUP BY c.id, f.fecha_agregado
      ORDER BY f.fecha_agregado DESC
    `, [userId]);

    res.json({
      favoritos: result.rows
    });

  } catch (error) {
    console.error('Error obteniendo favoritos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/users/favoritos/:comercioId - Agregar comercio a favoritos
router.post('/favoritos/:comercioId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { comercioId } = req.params;

    // Verificar que el comercio existe
    const comercioExists = await query('SELECT id FROM comercios WHERE id = $1', [comercioId]);
    if (comercioExists.rows.length === 0) {
      return res.status(404).json({ error: 'Comercio no encontrado' });
    }

    // Verificar si ya está en favoritos
    const existing = await query(
      'SELECT id FROM favoritos WHERE usuario_id = $1 AND comercio_id = $2',
      [userId, comercioId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Comercio ya está en favoritos' });
    }

    await query(
      'INSERT INTO favoritos (usuario_id, comercio_id) VALUES ($1, $2)',
      [userId, comercioId]
    );

    res.status(201).json({
      message: 'Comercio agregado a favoritos'
    });

  } catch (error) {
    console.error('Error agregando favorito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/users/favoritos/:comercioId - Remover comercio de favoritos
router.delete('/favoritos/:comercioId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { comercioId } = req.params;

    const result = await query(
      'DELETE FROM favoritos WHERE usuario_id = $1 AND comercio_id = $2',
      [userId, comercioId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Favorito no encontrado' });
    }

    res.json({
      message: 'Comercio removido de favoritos'
    });

  } catch (error) {
    console.error('Error removiendo favorito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/users/notificaciones - Obtener notificaciones del usuario
router.get('/notificaciones', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, leidas = 'all' } = req.query;

    let queryText = `
      SELECT id, titulo, mensaje, tipo, leida, fecha_creacion, datos_adicionales
      FROM notificaciones 
      WHERE usuario_id = $1
    `;

    const params = [userId];
    let paramCount = 1;

    if (leidas === 'true') {
      queryText += ` AND leida = true`;
    } else if (leidas === 'false') {
      queryText += ` AND leida = false`;
    }

    queryText += `
      ORDER BY fecha_creacion DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, params);

    // Contar notificaciones no leídas
    const unreadResult = await query(
      'SELECT COUNT(*) as no_leidas FROM notificaciones WHERE usuario_id = $1 AND leida = false',
      [userId]
    );

    res.json({
      notificaciones: result.rows,
      noLeidas: parseInt(unreadResult.rows[0].no_leidas),
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/users/notificaciones/:id/leer - Marcar notificación como leída
router.put('/notificaciones/:id/leer', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      'UPDATE notificaciones SET leida = true WHERE id = $1 AND usuario_id = $2',
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    res.json({
      message: 'Notificación marcada como leída'
    });

  } catch (error) {
    console.error('Error marcando notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
