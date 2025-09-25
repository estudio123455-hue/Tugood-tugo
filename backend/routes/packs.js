const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireRole, requireOwnership } = require('../middleware/auth');

const router = express.Router();

// GET /api/packs - Obtener packs con filtros
router.get('/', async (req, res) => {
  try {
    const { 
      zona, 
      tipo, 
      precio_max,
      disponible = 'true',
      limit = 20, 
      offset = 0,
      search,
      comercio_id
    } = req.query;

    let queryText = `
      SELECT p.id, p.titulo, p.descripcion, p.precio_original, p.precio_descuento,
             p.cantidad_disponible, p.hora_recogida_inicio, p.hora_recogida_fin,
             p.imagen_url, p.tipo_comida, p.tags, p.fecha_publicacion,
             c.id as comercio_id, c.nombre as comercio_nombre, c.direccion,
             c.zona_bogota, c.rating, c.latitud, c.longitud
      FROM packs p
      JOIN comercios c ON p.comercio_id = c.id
      WHERE p.activo = true AND c.verificado = true
    `;
    
    const params = [];
    let paramCount = 0;

    // Filtros
    if (disponible === 'true') {
      queryText += ` AND p.cantidad_disponible > 0`;
    }

    if (zona) {
      paramCount++;
      queryText += ` AND c.zona_bogota = $${paramCount}`;
      params.push(zona);
    }

    if (tipo) {
      paramCount++;
      queryText += ` AND p.tipo_comida = $${paramCount}`;
      params.push(tipo);
    }

    if (precio_max) {
      paramCount++;
      queryText += ` AND p.precio_descuento <= $${paramCount}`;
      params.push(parseFloat(precio_max));
    }

    if (search) {
      paramCount++;
      queryText += ` AND (p.titulo ILIKE $${paramCount} OR p.descripcion ILIKE $${paramCount} OR c.nombre ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (comercio_id) {
      paramCount++;
      queryText += ` AND c.id = $${paramCount}`;
      params.push(comercio_id);
    }

    queryText += `
      ORDER BY p.fecha_publicacion DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, params);

    res.json({
      packs: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error obteniendo packs:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/packs/:id - Obtener pack específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT p.*, 
             c.id as comercio_id, c.nombre as comercio_nombre, 
             c.direccion, c.zona_bogota, c.rating, c.total_reviews,
             c.latitud, c.longitud, c.horario_apertura, c.horario_cierre,
             u.telefono as comercio_telefono
      FROM packs p
      JOIN comercios c ON p.comercio_id = c.id
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE p.id = $1 AND p.activo = true
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pack no encontrado' });
    }

    res.json({
      pack: result.rows[0]
    });

  } catch (error) {
    console.error('Error obteniendo pack:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/packs - Crear nuevo pack (solo comercios)
router.post('/', [
  authenticateToken,
  requireRole('comercio'),
  body('titulo').trim().isLength({ min: 5, max: 150 }).withMessage('Título debe tener entre 5 y 150 caracteres'),
  body('descripcion').optional().trim().isLength({ max: 500 }),
  body('precio_original').isFloat({ min: 1000 }).withMessage('Precio original debe ser mayor a $1,000'),
  body('precio_descuento').isFloat({ min: 500 }).withMessage('Precio descuento debe ser mayor a $500'),
  body('cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0'),
  body('hora_recogida_inicio').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora inicio inválida'),
  body('hora_recogida_fin').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora fin inválida'),
  body('tipo_comida').optional().trim().isLength({ max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos inválidos', details: errors.array() });
    }

    const userId = req.user.id;
    
    // Obtener comercio del usuario
    const comercioResult = await query('SELECT id FROM comercios WHERE usuario_id = $1 AND verificado = true', [userId]);
    
    if (comercioResult.rows.length === 0) {
      return res.status(403).json({ error: 'Comercio no encontrado o no verificado' });
    }

    const comercioId = comercioResult.rows[0].id;
    
    const {
      titulo, descripcion, precio_original, precio_descuento,
      cantidad, hora_recogida_inicio, hora_recogida_fin,
      tipo_comida, tags, imagen_url
    } = req.body;

    // Validar que precio descuento sea menor que original
    if (precio_descuento >= precio_original) {
      return res.status(400).json({ error: 'Precio descuento debe ser menor que precio original' });
    }

    const result = await query(`
      INSERT INTO packs (
        comercio_id, titulo, descripcion, precio_original, precio_descuento,
        cantidad, cantidad_disponible, hora_recogida_inicio, hora_recogida_fin,
        tipo_comida, tags, imagen_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      comercioId, titulo, descripcion, precio_original, precio_descuento,
      cantidad, hora_recogida_inicio, hora_recogida_fin,
      tipo_comida, tags, imagen_url
    ]);

    res.status(201).json({
      message: 'Pack creado exitosamente',
      pack: result.rows[0]
    });

  } catch (error) {
    console.error('Error creando pack:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/packs/:id - Actualizar pack (solo dueño)
router.put('/:id', [
  authenticateToken,
  requireRole('comercio'),
  body('titulo').optional().trim().isLength({ min: 5, max: 150 }),
  body('descripcion').optional().trim().isLength({ max: 500 }),
  body('precio_original').optional().isFloat({ min: 1000 }),
  body('precio_descuento').optional().isFloat({ min: 500 }),
  body('cantidad_disponible').optional().isInt({ min: 0 }),
  body('hora_recogida_inicio').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('hora_recogida_fin').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('activo').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos inválidos', details: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que el pack pertenece al comercio del usuario
    const packResult = await query(`
      SELECT p.*, c.usuario_id 
      FROM packs p 
      JOIN comercios c ON p.comercio_id = c.id 
      WHERE p.id = $1
    `, [id]);

    if (packResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pack no encontrado' });
    }

    if (packResult.rows[0].usuario_id !== userId && req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para editar este pack' });
    }

    const updates = req.body;
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    // Validar precios si se actualizan
    if (updates.precio_descuento && updates.precio_original) {
      if (updates.precio_descuento >= updates.precio_original) {
        return res.status(400).json({ error: 'Precio descuento debe ser menor que precio original' });
      }
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    values.push(id);

    const result = await query(`
      UPDATE packs 
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING *
    `, values);

    res.json({
      message: 'Pack actualizado exitosamente',
      pack: result.rows[0]
    });

  } catch (error) {
    console.error('Error actualizando pack:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/packs/:id - Eliminar pack (desactivar)
router.delete('/:id', [
  authenticateToken,
  requireRole('comercio')
], async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar ownership
    const packResult = await query(`
      SELECT p.*, c.usuario_id 
      FROM packs p 
      JOIN comercios c ON p.comercio_id = c.id 
      WHERE p.id = $1
    `, [id]);

    if (packResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pack no encontrado' });
    }

    if (packResult.rows[0].usuario_id !== userId && req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este pack' });
    }

    // Desactivar en lugar de eliminar (para mantener historial)
    await query('UPDATE packs SET activo = false WHERE id = $1', [id]);

    res.json({
      message: 'Pack eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando pack:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/packs/me/list - Obtener packs del comercio autenticado
router.get('/me/list', [
  authenticateToken,
  requireRole('comercio')
], async (req, res) => {
  try {
    const userId = req.user.id;
    const { activo = 'all', limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT p.*, COUNT(pe.id) as total_pedidos
      FROM packs p
      JOIN comercios c ON p.comercio_id = c.id
      LEFT JOIN pedidos pe ON p.id = pe.pack_id
      WHERE c.usuario_id = $1
    `;

    const params = [userId];
    let paramCount = 1;

    if (activo === 'true') {
      queryText += ` AND p.activo = true`;
    } else if (activo === 'false') {
      queryText += ` AND p.activo = false`;
    }

    queryText += `
      GROUP BY p.id
      ORDER BY p.fecha_publicacion DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, params);

    res.json({
      packs: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error obteniendo packs del comercio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
