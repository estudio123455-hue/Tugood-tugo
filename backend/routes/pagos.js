const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/pagos - Procesar pago de un pedido
router.post('/', [
  authenticateToken,
  body('pedidoId').isInt({ min: 1 }).withMessage('Pedido ID requerido'),
  body('metodo').isIn(['tarjeta', 'nequi', 'daviplata', 'pse', 'paypal']).withMessage('Método de pago inválido'),
  body('datosPago').optional().isObject().withMessage('Datos de pago deben ser un objeto')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos inválidos', details: errors.array() });
    }

    const userId = req.user.id;
    const { pedidoId, metodo, datosPago } = req.body;

    const result = await transaction(async (client) => {
      // Verificar que el pedido existe y pertenece al usuario
      const pedidoResult = await client.query(`
        SELECT pe.*, p.titulo as pack_titulo, c.nombre as comercio_nombre
        FROM pedidos pe
        JOIN packs p ON pe.pack_id = p.id
        JOIN comercios c ON p.comercio_id = c.id
        WHERE pe.id = $1 AND pe.usuario_id = $2
        FOR UPDATE
      `, [pedidoId, userId]);

      if (pedidoResult.rows.length === 0) {
        throw new Error('Pedido no encontrado');
      }

      const pedido = pedidoResult.rows[0];

      // Verificar que el pedido está en estado pendiente o confirmado
      if (!['pendiente', 'confirmado'].includes(pedido.estado)) {
        throw new Error('El pedido no puede ser pagado en su estado actual');
      }

      // Verificar si ya existe un pago para este pedido
      const pagoExistente = await client.query(
        'SELECT id FROM pagos WHERE pedido_id = $1',
        [pedidoId]
      );

      if (pagoExistente.rows.length > 0) {
        throw new Error('El pedido ya tiene un pago asociado');
      }

      // Simular procesamiento de pago según el método
      let estadoPago = 'completado';
      let referenciaExterna = null;

      switch (metodo) {
        case 'nequi':
          referenciaExterna = `NEQ${Date.now()}${Math.floor(Math.random() * 1000)}`;
          break;
        case 'daviplata':
          referenciaExterna = `DAVI${Date.now()}${Math.floor(Math.random() * 1000)}`;
          break;
        case 'pse':
          referenciaExterna = `PSE${Date.now()}${Math.floor(Math.random() * 1000)}`;
          break;
        case 'tarjeta':
          referenciaExterna = `CARD${Date.now()}${Math.floor(Math.random() * 1000)}`;
          break;
        case 'paypal':
          referenciaExterna = `PP${Date.now()}${Math.floor(Math.random() * 1000)}`;
          break;
      }

      // Crear registro de pago
      const pagoResult = await client.query(`
        INSERT INTO pagos (pedido_id, metodo, monto, estado, referencia_externa, datos_pago)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [pedidoId, metodo, pedido.total, estadoPago, referenciaExterna, JSON.stringify(datosPago)]);

      // Actualizar estado del pedido a pagado
      await client.query(`
        UPDATE pedidos 
        SET estado = 'pagado'
        WHERE id = $1
      `, [pedidoId]);

      return {
        pago: pagoResult.rows[0],
        pedido: {
          id: pedido.id,
          pack: pedido.pack_titulo,
          comercio: pedido.comercio_nombre,
          total: pedido.total
        }
      };
    });

    res.status(201).json({
      message: 'Pago procesado exitosamente',
      pago: result.pago,
      pedido: result.pedido
    });

  } catch (error) {
    console.error('Error procesando pago:', error);
    if (error.message.includes('no encontrado') || error.message.includes('no puede ser') || error.message.includes('ya tiene')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error procesando el pago' });
  }
});

// GET /api/pagos/pedido/:pedidoId - Obtener pago de un pedido específico
router.get('/pedido/:pedidoId', authenticateToken, async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const userId = req.user.id;

    const result = await query(`
      SELECT pa.*, pe.usuario_id
      FROM pagos pa
      JOIN pedidos pe ON pa.pedido_id = pe.id
      WHERE pa.pedido_id = $1
    `, [pedidoId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    const pago = result.rows[0];

    // Verificar que el pago pertenece al usuario (o es admin)
    if (pago.usuario_id !== userId && req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para ver este pago' });
    }

    res.json({
      pago: {
        id: pago.id,
        metodo: pago.metodo,
        monto: pago.monto,
        estado: pago.estado,
        fecha_pago: pago.fecha_pago,
        referencia_externa: pago.referencia_externa
      }
    });

  } catch (error) {
    console.error('Error obteniendo pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/pagos/historial - Obtener historial de pagos del usuario
router.get('/historial', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, metodo, estado } = req.query;

    let queryText = `
      SELECT pa.id, pa.metodo, pa.monto, pa.estado, pa.fecha_pago, pa.referencia_externa,
             pe.id as pedido_id, pe.codigo_qr,
             p.titulo as pack_titulo,
             c.nombre as comercio_nombre
      FROM pagos pa
      JOIN pedidos pe ON pa.pedido_id = pe.id
      JOIN packs p ON pe.pack_id = p.id
      JOIN comercios c ON p.comercio_id = c.id
      WHERE pe.usuario_id = $1
    `;

    const params = [userId];
    let paramCount = 1;

    if (metodo) {
      paramCount++;
      queryText += ` AND pa.metodo = $${paramCount}`;
      params.push(metodo);
    }

    if (estado) {
      paramCount++;
      queryText += ` AND pa.estado = $${paramCount}`;
      params.push(estado);
    }

    queryText += `
      ORDER BY pa.fecha_pago DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, params);

    res.json({
      pagos: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error obteniendo historial de pagos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/pagos/:id/reembolso - Solicitar reembolso (solo admins por ahora)
router.post('/:id/reembolso', [
  authenticateToken,
  requireRole('admin'),
  body('motivo').trim().isLength({ min: 10, max: 500 }).withMessage('Motivo debe tener entre 10 y 500 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos inválidos', details: errors.array() });
    }

    const { id } = req.params;
    const { motivo } = req.body;

    const result = await transaction(async (client) => {
      // Verificar que el pago existe y está completado
      const pagoResult = await client.query(`
        SELECT pa.*, pe.usuario_id, pe.pack_id, pe.cantidad
        FROM pagos pa
        JOIN pedidos pe ON pa.pedido_id = pe.id
        WHERE pa.id = $1 AND pa.estado = 'completado'
        FOR UPDATE
      `, [id]);

      if (pagoResult.rows.length === 0) {
        throw new Error('Pago no encontrado o no puede ser reembolsado');
      }

      const pago = pagoResult.rows[0];

      // Actualizar estado del pago
      await client.query(`
        UPDATE pagos 
        SET estado = 'reembolsado'
        WHERE id = $1
      `, [id]);

      // Actualizar estado del pedido
      await client.query(`
        UPDATE pedidos 
        SET estado = 'cancelado'
        WHERE id = $1
      `, [pago.pedido_id]);

      // Devolver cantidad al pack
      await client.query(`
        UPDATE packs 
        SET cantidad_disponible = cantidad_disponible + $1
        WHERE id = $2
      `, [pago.cantidad, pago.pack_id]);

      return pago;
    });

    res.json({
      message: 'Reembolso procesado exitosamente',
      motivo
    });

  } catch (error) {
    console.error('Error procesando reembolso:', error);
    if (error.message.includes('no encontrado') || error.message.includes('no puede ser')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error procesando el reembolso' });
  }
});

// GET /api/pagos/metodos - Obtener métodos de pago disponibles
router.get('/metodos', (req, res) => {
  const metodos = [
    {
      id: 'tarjeta',
      nombre: 'Tarjeta de Crédito/Débito',
      descripcion: 'Visa, Mastercard',
      icono: 'credit-card',
      activo: true
    },
    {
      id: 'nequi',
      nombre: 'Nequi',
      descripcion: 'Pago móvil',
      icono: 'smartphone',
      activo: true
    },
    {
      id: 'daviplata',
      nombre: 'Daviplata',
      descripcion: 'Billetera digital',
      icono: 'wallet',
      activo: true
    },
    {
      id: 'pse',
      nombre: 'PSE',
      descripcion: 'Débito desde cuenta bancaria',
      icono: 'bank',
      activo: true
    },
    {
      id: 'paypal',
      nombre: 'PayPal',
      descripcion: 'Pago internacional',
      icono: 'paypal',
      activo: false // Deshabilitado por ahora
    }
  ];

  res.json({
    metodos: metodos.filter(m => m.activo)
  });
});

// GET /api/pagos/stats - Estadísticas de pagos (admin)
router.get('/stats', [
  authenticateToken,
  requireRole('admin')
], async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    let queryText = `
      SELECT 
        COUNT(*) as total_pagos,
        SUM(monto) as monto_total,
        AVG(monto) as monto_promedio,
        COUNT(CASE WHEN estado = 'completado' THEN 1 END) as pagos_exitosos,
        COUNT(CASE WHEN estado = 'fallido' THEN 1 END) as pagos_fallidos,
        COUNT(CASE WHEN estado = 'reembolsado' THEN 1 END) as reembolsos
      FROM pagos
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (fecha_inicio) {
      paramCount++;
      queryText += ` AND fecha_pago >= $${paramCount}`;
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      paramCount++;
      queryText += ` AND fecha_pago <= $${paramCount}`;
      params.push(fecha_fin);
    }

    const result = await query(queryText, params);

    // Estadísticas por método de pago
    const metodoStats = await query(`
      SELECT metodo, COUNT(*) as total, SUM(monto) as monto_total
      FROM pagos
      WHERE estado = 'completado'
      ${fecha_inicio ? 'AND fecha_pago >= $1' : ''}
      ${fecha_fin ? `AND fecha_pago <= $${fecha_inicio ? '2' : '1'}` : ''}
      GROUP BY metodo
      ORDER BY monto_total DESC
    `, params);

    res.json({
      estadisticas_generales: result.rows[0],
      por_metodo: metodoStats.rows
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de pagos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
