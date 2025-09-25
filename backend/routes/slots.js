const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/slots - listar franjas por comercio o fecha
router.get('/', async (req, res) => {
  try {
    const { comercio_id, fecha, activo = 'true' } = req.query;

    let sql = `
      SELECT s.*, c.nombre AS comercio_nombre
      FROM slots s
      JOIN comercios c ON s.comercio_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let n = 0;

    if (comercio_id) {
      n++; sql += ` AND s.comercio_id = $${n}`; params.push(comercio_id);
    }
    if (fecha) {
      n++; sql += ` AND s.fecha = $${n}`; params.push(fecha);
    }
    if (activo === 'true') sql += ' AND s.activo = 1';

    sql += ' ORDER BY s.fecha, s.hora_inicio';

    const result = await query(sql, params);
    res.json({ slots: result.rows });
  } catch (err) {
    console.error('Error listando slots:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/slots - crear franja (comercio)
router.post('/', [
  authenticateToken,
  requireRole('comercio'),
  body('fecha').isISO8601().withMessage('Fecha inválida'),
  body('hora_inicio').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('hora_fin').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('capacidad').isInt({ min: 1 }),
  body('precio_descuento').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos inválidos', details: errors.array() });
    }

    const userId = req.user.id;
    const comercioResult = await query('SELECT id FROM comercios WHERE usuario_id = $1 AND verificado = true', [userId]);
    if (comercioResult.rows.length === 0) {
      return res.status(403).json({ error: 'Comercio no encontrado o no verificado' });
    }
    const comercioId = comercioResult.rows[0].id;

    const { fecha, hora_inicio, hora_fin, capacidad, precio_descuento, titulo, descripcion, pack_id } = req.body;

    const insert = await query(`
      INSERT INTO slots (comercio_id, titulo, descripcion, fecha, hora_inicio, hora_fin, capacidad, disponible, precio_descuento, pack_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9)
      RETURNING *
    `, [comercioId, titulo || null, descripcion || null, fecha, hora_inicio, hora_fin, capacidad, precio_descuento || null, pack_id || null]);

    res.status(201).json({ message: 'Franja creada', slot: insert.rows[0] });
  } catch (err) {
    console.error('Error creando slot:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/slots/:id/cerrar - cerrar franja manualmente
router.put('/:id/cerrar', [authenticateToken, requireRole('comercio')], async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('UPDATE slots SET activo = 0 WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Slot no encontrado' });
    res.json({ message: 'Franja cerrada', slot: result.rows[0] });
  } catch (err) {
    console.error('Error cerrando slot:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;


