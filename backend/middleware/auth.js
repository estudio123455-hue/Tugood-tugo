const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware para verificar JWT token
const authenticateToken = async (req, res, next) => {
  try {
    console.log('Headers recibidos:', req.headers);
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    
    if (!authHeader) {
      console.error('No se encontró el encabezado de autorización');
      return res.status(401).json({ 
        error: 'No autorizado',
        details: 'Se requiere token de autenticación',
        solution: 'Asegúrate de incluir el token en el encabezado Authorization: Bearer <token>'
      });
    }

    // Extraer el token (soporta 'Bearer token' o solo 'token')
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    
    if (!token) {
      console.error('Formato de token inválido');
      return res.status(401).json({ 
        error: 'Formato de token inválido',
        details: 'El formato debe ser: Bearer <token>',
        example: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      });
    }

    console.log('Token recibido:', token);
    
    try {
      // Verificar y decodificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decodificado:', decoded);
      
      if (!decoded.userId) {
        console.error('Token no contiene userId');
        return res.status(401).json({ 
          error: 'Token inválido',
          details: 'El token no contiene información de usuario válida'
        });
      }
      
      // Verificar que el usuario existe y está activo
      const result = await query(
        'SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        console.error('Usuario no encontrado en la base de datos');
        return res.status(401).json({ 
          error: 'Usuario no encontrado',
          details: 'El usuario asociado al token no existe en el sistema'
        });
      }

      const user = result.rows[0];
      if (!user.activo) {
        console.error('Usuario inactivo');
        return res.status(401).json({ 
          error: 'Usuario inactivo',
          details: 'La cuenta del usuario ha sido desactivada'
        });
      }

      console.log('Autenticación exitosa para el usuario:', user.email);
      req.user = user;
      next();
      
    } catch (error) {
      console.error('Error al verificar el token:', {
        name: error.name,
        message: error.message,
        expiredAt: error.expiredAt
      });
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Token inválido',
          details: 'El token proporcionado no es válido',
          solution: 'Inicia sesión nuevamente para obtener un nuevo token'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expirado',
          details: 'La sesión ha expirado',
          solution: 'Inicia sesión nuevamente para continuar'
        });
      }
      
      throw error; // Re-lanzar para ser capturado por el catch externo
    }
  } catch (error) {
    console.error('Error en el middleware de autenticación:', error);
    return res.status(500).json({ 
      error: 'Error de autenticación',
      details: 'Ocurrió un error al verificar la autenticación',
      internalError: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Middleware para verificar roles específicos
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    if (!userRoles.includes(req.user.rol)) {
      return res.status(403).json({ 
        error: 'No tienes permisos para realizar esta acción',
        required: userRoles,
        current: req.user.rol
      });
    }

    next();
  };
};

// Middleware para verificar que el usuario es dueño del recurso o admin
const requireOwnership = (resourceIdParam = 'id', userIdField = 'usuario_id') => {
  return async (req, res, next) => {
    try {
      if (req.user.rol === 'admin') {
        return next(); // Admins pueden acceder a todo
      }

      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;

      // Verificar ownership según el contexto
      let query_text;
      let params;

      if (req.route.path.includes('comercios')) {
        query_text = 'SELECT usuario_id FROM comercios WHERE id = $1';
        params = [resourceId];
      } else if (req.route.path.includes('pedidos')) {
        query_text = 'SELECT usuario_id FROM pedidos WHERE id = $1';
        params = [resourceId];
      } else {
        // Generic ownership check
        query_text = `SELECT ${userIdField} FROM ${req.route.path.split('/')[1]} WHERE id = $1`;
        params = [resourceId];
      }

      const result = await query(query_text, params);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Recurso no encontrado' });
      }

      const resourceUserId = result.rows[0][userIdField] || result.rows[0].usuario_id;
      
      if (resourceUserId !== userId) {
        return res.status(403).json({ error: 'No tienes permisos para acceder a este recurso' });
      }

      next();
    } catch (error) {
      console.error('Error verificando ownership:', error);
      res.status(500).json({ error: 'Error verificando permisos' });
    }
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnership
};
