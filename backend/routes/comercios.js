const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireRole, requireOwnership } = require('../middleware/auth');

const router = express.Router();

// GET /api/comercios - Obtener comercios con filtros
router.get('/', async (req, res) => {
  try {
    const { 
      zona, 
      tipo, 
      verificado = 'true', 
      limit = 20, 
      offset = 0,
      search,
      lat,
      lng,
      radius = 5
    } = req.query;

    let queryText = `
      SELECT c.id, c.nombre, c.direccion, c.barrio, c.zona_bogota, 
             c.latitud, c.longitud, c.tipo_comercio, c.verificado,
             c.rating, c.total_reviews, c.imagen_url,
             c.horario_apertura, c.horario_cierre,
             COUNT(p.id) as packs_activos
      FROM comercios c
      LEFT JOIN packs p ON c.id = p.comercio_id AND p.activo = true
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    // Filtros
    if (verificado === 'true') {
      queryText += ` AND c.verificado = true`;
    }

    if (zona) {
      paramCount++;
      queryText += ` AND c.zona_bogota = $${paramCount}`;
      params.push(zona);
    }

    if (tipo) {
      paramCount++;
      queryText += ` AND c.tipo_comercio = $${paramCount}`;
      params.push(tipo);
    }

    if (search) {
      paramCount++;
      queryText += ` AND (c.nombre ILIKE $${paramCount} OR c.barrio ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Filtro por distancia (si se proporcionan coordenadas)
    if (lat && lng) {
      paramCount += 3;
      queryText += ` AND (
        6371 * acos(
          cos(radians($${paramCount-2})) * cos(radians(c.latitud)) * 
          cos(radians(c.longitud) - radians($${paramCount-1})) + 
          sin(radians($${paramCount-2})) * sin(radians(c.latitud))
        )
      ) <= $${paramCount}`;
      params.push(parseFloat(lat), parseFloat(lng), parseFloat(radius));
    }

    queryText += `
      GROUP BY c.id
      ORDER BY c.rating DESC, packs_activos DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, params);

    res.json({
      comercios: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error obteniendo comercios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/comercios/:id - Obtener comercio específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT c.*, u.nombre as usuario_nombre, u.email, u.telefono,
             COUNT(p.id) as total_packs,
             COUNT(CASE WHEN p.activo = true THEN 1 END) as packs_activos
      FROM comercios c
      JOIN usuarios u ON c.usuario_id = u.id
      LEFT JOIN packs p ON c.id = p.comercio_id
      WHERE c.id = $1
      GROUP BY c.id, u.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comercio no encontrado' });
    }

    const comercio = result.rows[0];

    // Obtener packs activos del comercio
    const packsResult = await query(`
      SELECT id, titulo, descripcion, precio_original, precio_descuento,
             cantidad_disponible, hora_recogida_inicio, hora_recogida_fin,
             imagen_url, tipo_comida, tags
      FROM packs 
      WHERE comercio_id = $1 AND activo = true
      ORDER BY fecha_publicacion DESC
    `, [id]);

    res.json({
      comercio,
      packs: packsResult.rows
    });

  } catch (error) {
    console.error('Error obteniendo comercio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/comercios/:id - Actualizar comercio (solo dueño o admin)
router.put('/:id', [
  authenticateToken,
  requireOwnership('id'),
  body('nombre').optional().trim().isLength({ min: 2, max: 150 }),
  body('direccion').optional().trim().isLength({ min: 5, max: 500 }),
  body('barrio').optional().trim().isLength({ min: 2, max: 100 }),
  body('zona_bogota').optional().isIn(['Chapinero','Usaquén','Teusaquillo','Kennedy','Zona Rosa','La Candelaria','Suba','Engativá']),
  body('tipo_comercio').optional().isIn(['panadería','restaurante','supermercado','cafetería','corrientazo','saludable','comida rápida']),
  body('nit').optional().trim().isLength({ min: 8, max: 20 }),
  body('latitud').optional().isFloat({ min: -90, max: 90 }),
  body('longitud').optional().isFloat({ min: -180, max: 180 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos inválidos', details: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    // Construir query dinámico
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    values.push(id);

    const result = await query(`
      UPDATE comercios 
      SET ${setClause}, fecha_actualizacion = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comercio no encontrado' });
    }

    res.json({
      message: 'Comercio actualizado exitosamente',
      comercio: result.rows[0]
    });

  } catch (error) {
    console.error('Error actualizando comercio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/comercios/me/profile - Obtener perfil del comercio autenticado
router.get('/me/profile', [
  authenticateToken,
  requireRole('comercio')
], async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT c.*, 
             COUNT(p.id) as total_packs,
             COUNT(CASE WHEN p.activo = true THEN 1 END) as packs_activos,
             COUNT(CASE WHEN pe.estado = 'completado' THEN 1 END) as pedidos_completados
      FROM comercios c
      LEFT JOIN packs p ON c.id = p.comercio_id
      LEFT JOIN pedidos pe ON p.id = pe.pack_id
      WHERE c.usuario_id = $1
      GROUP BY c.id
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Perfil de comercio no encontrado' });
    }

    res.json({
      comercio: result.rows[0]
    });

  } catch (error) {
    console.error('Error obteniendo perfil comercio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/comercios/zonas - Obtener zonas disponibles
router.get('/zonas/list', async (req, res) => {
  try {
    const result = await query(`
      SELECT zona_bogota, COUNT(*) as total_comercios
      FROM comercios 
      WHERE verificado = true
      GROUP BY zona_bogota
      ORDER BY total_comercios DESC
    `);

    const zonas = [
      'Chapinero', 'Usaquén', 'Teusaquillo', 'Kennedy', 
      'Zona Rosa', 'La Candelaria', 'Suba', 'Engativá'
    ];

    const zonasConComercio = result.rows.reduce((acc, row) => {
      acc[row.zona_bogota] = parseInt(row.total_comercios);
      return acc;
    }, {});

    const zonasCompletas = zonas.map(zona => ({
      nombre: zona,
      comercios: zonasConComercio[zona] || 0
    }));

    res.json({
      zonas: zonasCompletas
    });

  } catch (error) {
    console.error('Error obteniendo zonas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
