import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { testConnection } from './config/database.js';
// Importar rutas de la API
import apiRoutes from './src/routes/api.js';
import fs from 'fs';

dotenv.config();

// Configuración de rutas de módulos ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de seguridad
app.use(helmet());
app.use(compression());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000', 
  'http://127.0.0.1:3000', 
  'http://10.215.186.158:3000',
  'https://tugood-tugo.vercel.app',
  'https://tugood-tugo-frontend.vercel.app',
  'https://tugood-tugo-backend.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly
app.options('*', cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 peticiones por ventana
  message: 'Demasiadas peticiones desde esta IP, por favor inténtalo de nuevo en 15 minutos',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // No aplicar rate limiting a las rutas de OTP (ya tienen su propio rate limiting)
    return req.path.startsWith('/api/otp');
  }
});

// Aplicar rate limiter a todas las rutas
app.use(apiLimiter);
// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Configuración de middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rutas de la API
if (fs.existsSync('./src/routes/api.js')) {
  app.use('/api', apiRoutes);
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await testConnection();
    res.json({
      status: 'ok',
      message: 'Servidor funcionando correctamente',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en el health check:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      error: error.message
    });
  }
});


// Inicializar la aplicación
async function initializeApp() {
  try {
    
    // Ruta de prueba
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    });
    
    // Ruta raíz
    app.get('/', (req, res) => {
      res.send('¡Bienvenido a la API de TuGood TuGo!');
    });
    
    // Manejador de errores global
    app.use((err, req, res, next) => {
      console.error('❌ Error no manejado:', err);
      res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });
    
    // Iniciar el servidor
    const PORT = process.env.PORT || 5000;
    return new Promise((resolve, reject) => {
      const server = app.listen(PORT, () => {
        console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
        console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📡 URL: http://localhost:${PORT}`);
        console.log(`🔄 Ruta de salud: http://localhost:${PORT}/api/health`);
        resolve(server);
      });
      
      server.on('error', (error) => {
        console.error('❌ Error del servidor:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('❌ Error al inicializar la aplicación:', error);
    throw error; // Propagar el error para que sea manejado por el llamador
  }
}

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error en la aplicación:', err);
  
  // Default error status and message
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle graceful shutdown
const gracefulShutdown = async () => {
  console.log('🛑 Apagando servidor...');
  
  try {
    // Cerrar el servidor
    if (server) {
      server.close(() => {
        console.log('✅ Servidor HTTP cerrado');
        process.exit(0);
      });
    }
  } catch (error) {
    console.error('❌ Error durante el apagado:', error);
    process.exit(1);
  }
};

// Manejadores de señales
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start server
let server; // Declarar server en el ámbito global

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    console.log('✅ Conexión a la base de datos exitosa');
    
    // Start HTTP server
    return new Promise((resolve, reject) => {
      const httpServer = app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
        console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
        resolve(httpServer);
      });
      
      // Handle server errors
      httpServer.on('error', (error) => {
        if (error.syscall !== 'listen') {
          reject(error);
          return;
        }
        
        // Handle specific listen errors with friendly messages
        switch (error.code) {
          case 'EACCES':
            console.error(`El puerto ${PORT} requiere privilegios elevados`);
            process.exit(1);
            break;
          case 'EADDRINUSE':
            console.error(`El puerto ${PORT} ya está en uso`);
            process.exit(1);
            break;
          default:
            reject(error);
        }
      });
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    throw error;
  }
};

// Export the Express API for Vercel
module.exports = app;

// Iniciar el servidor si este archivo se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  // Iniciar el servidor de manera síncrona
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n========================================');
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Ruta de salud: http://localhost:${PORT}/api/health`);
    console.log('========================================\n');
  });

  // Manejar señales de terminación
  process.on('SIGINT', () => {
    console.log('\n🔴 Recibida señal de terminación. Cerrando servidor...');
    server.close(() => {
      console.log('✅ Servidor cerrado correctamente');
      process.exit(0);
    });
  });

  // Manejar errores no capturados
  process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
    server.close(() => process.exit(1));
  });

  process.on('unhandledRejection', (reason) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
  });
}

// Exportar la aplicación para pruebas
export default app;
