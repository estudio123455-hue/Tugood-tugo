const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireRole, requireOwnership } = require('../middleware/auth');

const router = express.Router();

// POST /api/pedidos/confirmar-entrega - Confirmar entrega de pedido (sin autenticación para restaurantes)
router.post('/confirmar-entrega', [
  body('pedidoId').notEmpty().withMessage('ID de pedido es requerido'),
  body('codigoSeguridad').notEmpty().withMessage('Código de seguridad es requerido'),
  body('comercio').notEmpty().withMessage('Comercio es requerido'),
  body('token').optional(),
  body('fechaEntrega').isISO8601().withMessage('Fecha de entrega debe ser válida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de confirmación inválidos',
        errors: errors.array()
      });
    }

    const { pedidoId, codigoSeguridad, comercio, token, fechaEntrega } = req.body;

    // Buscar el pedido y verificar el código de seguridad
    const pedidoQuery = `
      SELECT pe.*, c.nombre as comercio_nombre 
      FROM pedidos pe
      JOIN packs p ON pe.pack_id = p.id
      JOIN comercios c ON p.comercio_id = c.id
      WHERE pe.id = $1 AND pe.codigo_qr = $2 AND c.nombre = $3
    `;

    const pedidoResult = await query(pedidoQuery, [pedidoId, codigoSeguridad, comercio]);

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado o código de seguridad incorrecto'
      });
    }

    const pedido = pedidoResult.rows[0];

    // Verificar que el pedido esté en estado válido para entrega
    if (pedido.estado === 'entregado') {
      return res.status(400).json({
        success: false,
        message: 'Este pedido ya ha sido entregado'
      });
    }

    // Actualizar el estado del pedido a entregado
    const updateQuery = `
      UPDATE pedidos 
      SET estado = 'entregado', fecha_entrega = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    await query(updateQuery, [fechaEntrega, pedidoId]);

    res.json({
      success: true,
      message: 'Pedido marcado como entregado exitosamente',
      data: {
        pedidoId: pedidoId,
        fechaEntrega: fechaEntrega,
        comercio: comercio,
        token: token,
        confirmadoVia: token ? 'QR Universal' : 'Sistema Tradicional'
      }
    });

  } catch (error) {
    console.error('Error confirmando entrega:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al confirmar entrega'
    });
  }
});

// GET /api/pedidos/usuario/:id - Obtener pedidos por ID de usuario (para administradores o el propio usuario)
router.get('/usuario/:id', [
  authenticateToken,
  requireRole(['admin']) // Solo admin puede ver pedidos de otros usuarios
], async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { estado = 'all' } = req.query;

    let queryText = `
      SELECT 
        pe.id,
        pe.cantidad,
        pe.estado,
        pe.fecha_pedido,
        pe.codigo_qr,
        pe.total,
        
        p.titulo AS pack_titulo,
        p.precio_descuento,
        p.imagen_url,
        p.hora_recogida_inicio,
        p.hora_recogida_fin,
        c.id AS comercio_id,
        c.nombre AS comercio_nombre,
        c.direccion,
        c.zona_bogota,
        c.telefono,
        pa.metodo AS metodo_pago,
        pa.estado AS estado_pago
      FROM pedidos pe
      JOIN packs p ON pe.pack_id = p.id
      JOIN comercios c ON p.comercio_id = c.id
      LEFT JOIN pagos pa ON pe.id = pa.pedido_id
      WHERE pe.usuario_id = $1
    `;

    const params = [userId];

    if (estado !== 'all') {
      queryText += ' AND pe.estado = $2';
      params.push(estado);
    }

    queryText += ' ORDER BY pe.fecha_pedido DESC';

    const result = await query(queryText, params);

    // Siempre devolver 200 con un objeto que contiene el array de pedidos
    res.status(200).json({
      total: result.rows.length,
      orders: result.rows
    });

  } catch (error) {
    console.error('Error obteniendo pedidos del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/pedidos - Obtener pedidos del usuario autenticado
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { estado = 'all', limit = 20, offset = 0 } = req.query;

    let queryText = `
      SELECT 
        pe.id,
        pe.cantidad,
        pe.estado,
        pe.fecha_pedido,
        pe.codigo_qr,
        pe.total,
        
        p.titulo AS pack_titulo,
        p.precio_descuento,
        p.imagen_url,
        p.hora_recogida_inicio,
        p.hora_recogida_fin,
        c.id AS comercio_id,
        c.nombre AS comercio_nombre,
        c.direccion,
        c.zona_bogota,
        c.telefono,
        pa.metodo AS metodo_pago,
        pa.estado AS estado_pago
      FROM pedidos pe
      JOIN packs p ON pe.pack_id = p.id
      JOIN comercios c ON p.comercio_id = c.id
      LEFT JOIN pagos pa ON pe.id = pa.pedido_id
      WHERE pe.usuario_id = $1
    `;

    const params = [userId];
    let paramCount = 1;

    if (estado !== 'all') {
      paramCount++;
      queryText += ` AND pe.estado = $${paramCount}`;
      params.push(estado);
    }

    queryText += `
      ORDER BY pe.fecha_pedido DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, params);

    res.json({
      pedidos: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/pedidos/:id - Obtener pedido específico
router.get('/:id', [
  authenticateToken,
  requireOwnership('id')
], async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT pe.*, 
             p.titulo as pack_titulo, p.descripcion as pack_descripcion,
             p.precio_original, p.precio_descuento, p.imagen_url,
             p.hora_recogida_inicio, p.hora_recogida_fin,
             c.id as comercio_id, c.nombre as comercio_nombre,
             c.direccion, c.zona_bogota, c.latitud, c.longitud,
             u.telefono as comercio_telefono,
             pa.metodo as metodo_pago, pa.estado as estado_pago,
             pa.fecha_pago, pa.referencia_externa
      FROM pedidos pe
      JOIN packs p ON pe.pack_id = p.id
      JOIN comercios c ON p.comercio_id = c.id
      JOIN usuarios u ON c.usuario_id = u.id
      LEFT JOIN pagos pa ON pe.id = pa.pedido_id
      WHERE pe.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({
      pedido: result.rows[0]
    });

  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/pedidos - Crear nuevo pedido
router.post('/', [
  authenticateToken,
  requireRole('cliente'),
  body('packId').optional().isInt({ min: 1 }).withMessage('Pack ID inválido'),
  body('slotId').optional().isInt({ min: 1 }).withMessage('Slot ID inválido'),
  body('cantidad').isInt({ min: 1, max: 10 }).withMessage('Cantidad debe ser entre 1 y 10'),
  body('notas').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos inválidos', details: errors.array() });
    }

    const userId = req.user.id;
    const { packId, slotId, cantidad, notas } = req.body;

    // Usar transacción para garantizar consistencia
    const result = await transaction(async (client) => {
      if (!packId && !slotId) {
        throw new Error('Debe especificar packId o slotId');
      }

      if (slotId) {
        // Compra por franja horaria
        const slotRes = await client.query(`
          SELECT s.*, c.nombre as comercio_nombre
          FROM slots s
          JOIN comercios c ON s.comercio_id = c.id
          WHERE s.id = $1 AND s.activo = 1
          FOR UPDATE
        `, [slotId]);

        if (slotRes.rows.length === 0) {
          throw new Error('Franja horaria no disponible');
        }

        const slot = slotRes.rows[0];
        if (slot.disponible < cantidad) {
          throw new Error(`Solo quedan ${slot.disponible} unidades disponibles en esta franja`);
        }

        const precio = slot.precio_descuento || 0;
        const total = precio * cantidad;

        const pedidoResult = await client.query(`
          INSERT INTO pedidos (usuario_id, pack_id, cantidad, total)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `, [userId, slot.pack_id || null, cantidad, total]);

        const pedido = pedidoResult.rows[0];

        // Restar del slot
        const upd = await client.query(`
          UPDATE slots SET disponible = disponible - $1, activo = CASE WHEN disponible - $1 <= 0 THEN 0 ELSE activo END
          WHERE id = $2
          RETURNING disponible
        `, [cantidad, slotId]);

        return {
          pedido,
          pack: {
            titulo: slot.titulo || 'Franja',
            comercio: slot.comercio_nombre,
            precio_unitario: precio
          }
        };
      } else {
        // Compra directa del pack
        const packResult = await client.query(`
          SELECT p.*, c.nombre as comercio_nombre
          FROM packs p
          JOIN comercios c ON p.comercio_id = c.id
          WHERE p.id = $1 AND p.activo = true
          FOR UPDATE
        `, [packId]);

        if (packResult.rows.length === 0) {
          throw new Error('Pack no encontrado o no disponible');
        }

        const pack = packResult.rows[0];
        if (pack.cantidad_disponible < cantidad) {
          throw new Error(`Solo quedan ${pack.cantidad_disponible} unidades disponibles`);
        }

        const total = pack.precio_descuento * cantidad;
        const pedidoResult = await client.query(`
          INSERT INTO pedidos (usuario_id, pack_id, cantidad, total)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `, [userId, packId, cantidad, total]);

        const pedido = pedidoResult.rows[0];
        await client.query(`
          UPDATE packs SET cantidad_disponible = cantidad_disponible - $1 WHERE id = $2
        `, [cantidad, packId]);

        return {
          pedido,
          pack: {
            titulo: pack.titulo,
            comercio: pack.comercio_nombre,
            precio_unitario: pack.precio_descuento
          }
        };
      }
    });

    res.status(201).json({
      message: 'Pedido creado exitosamente',
      pedido: result.pedido,
      pack: result.pack
    });

  } catch (error) {
    console.error('Error creando pedido:', error);
    if (error.message.includes('quedan') || error.message.includes('no encontrado')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/pedidos/:id/cancelar - Cancelar pedido
router.put('/:id/cancelar', [
  authenticateToken,
  requireOwnership('id')
], async (req, res) => {
  try {
    const { id } = req.params;

    const result = await transaction(async (client) => {
      // Obtener información del pedido
      const pedidoResult = await client.query(`
        SELECT pe.*, p.id as pack_id
        FROM pedidos pe
        JOIN packs p ON pe.pack_id = p.id
        WHERE pe.id = $1
        FOR UPDATE
      `, [id]);

      if (pedidoResult.rows.length === 0) {
        throw new Error('Pedido no encontrado');
      }

      const pedido = pedidoResult.rows[0];

      // Solo se puede cancelar si está pendiente o confirmado
      if (!['pendiente', 'confirmado'].includes(pedido.estado)) {
        throw new Error('No se puede cancelar un pedido en estado: ' + pedido.estado);
      }

      // Actualizar estado del pedido
      await client.query(`
        UPDATE pedidos 
        SET estado = 'cancelado'
        WHERE id = $1
      `, [id]);

      // Devolver cantidad al pack
      await client.query(`
        UPDATE packs 
        SET cantidad_disponible = cantidad_disponible + $1
        WHERE id = $2
      `, [pedido.cantidad, pedido.pack_id]);

      return pedido;
    });

    res.json({
      message: 'Pedido cancelado exitosamente'
    });

  } catch (error) {
    console.error('Error cancelando pedido:', error);
    if (error.message.includes('No se puede cancelar') || error.message.includes('no encontrado')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/pedidos/comercio/list - Obtener pedidos del comercio (para comerciantes)
router.get('/comercio/list', [
  authenticateToken,
  requireRole('comercio')
], async (req, res) => {
  try {
    const userId = req.user.id;
    const { estado = 'all', limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT pe.id, pe.cantidad, pe.estado, pe.fecha_pedido, pe.codigo_qr,
             pe.total, 
             p.titulo as pack_titulo, p.precio_descuento,
             u.nombre as cliente_nombre, u.telefono as cliente_telefono,
             pa.metodo as metodo_pago, pa.estado as estado_pago
      FROM pedidos pe
      JOIN packs p ON pe.pack_id = p.id
      JOIN comercios c ON p.comercio_id = c.id
      JOIN usuarios u ON pe.usuario_id = u.id
      LEFT JOIN pagos pa ON pe.id = pa.pedido_id
      WHERE c.usuario_id = $1
    `;

    const params = [userId];
    let paramCount = 1;

    if (estado !== 'all') {
      paramCount++;
      queryText += ` AND pe.estado = $${paramCount}`;
      params.push(estado);
    }

    queryText += `
      ORDER BY pe.fecha_pedido DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, params);

    res.json({
      pedidos: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error obteniendo pedidos del comercio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/pedidos/:id/estado - Actualizar estado del pedido (solo comerciantes)
router.put('/:id/estado', [
  authenticateToken,
  requireRole('comercio'),
  body('estado').isIn(['confirmado', 'listo', 'recogido']).withMessage('Estado inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos inválidos', details: errors.array() });
    }

    const { id } = req.params;
    const { estado } = req.body;
    const userId = req.user.id;

    // Verificar que el pedido pertenece a un pack del comercio
    const pedidoResult = await query(`
      SELECT pe.*, c.usuario_id
      FROM pedidos pe
      JOIN packs p ON pe.pack_id = p.id
      JOIN comercios c ON p.comercio_id = c.id
      WHERE pe.id = $1
    `, [id]);

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (pedidoResult.rows[0].usuario_id !== userId) {
      return res.status(403).json({ error: 'No tienes permisos para modificar este pedido' });
    }

    // Actualizar estado
    const updateResult = await query(`
      UPDATE pedidos 
      SET estado = $1
      WHERE id = $2
      RETURNING *
    `, [estado, id]);

    res.json({
      message: 'Estado del pedido actualizado',
      pedido: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Error actualizando estado del pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/pedidos/stats - Estadísticas de pedidos del usuario
router.get('/stats/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COUNT(CASE WHEN estado = 'recogido' THEN 1 END) as pedidos_completados,
        COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as pedidos_cancelados,
        COALESCE(SUM(CASE WHEN estado = 'recogido' THEN total ELSE 0 END), 0) as total_ahorrado,
        COALESCE(AVG(CASE WHEN estado = 'recogido' THEN total ELSE NULL END), 0) as promedio_por_pedido
      FROM pedidos 
      WHERE usuario_id = $1
    `, [userId]);

    res.json({
      estadisticas: result.rows[0]
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
