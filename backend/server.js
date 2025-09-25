import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

// Configuración de rutas de módulos ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar Redis
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.on('connect', () => {
  console.log('🚀 Conectado a Redis');
});

// Hacer redisClient accesible en todas las rutas
const attachRedis = (req, res, next) => {
  req.redis = redisClient;
  next();
};

// Importar rutas dinámicamente para soportar módulos ES6
import { testConnection } from './config/database.js';

// Importar rutas
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import comercioRoutes from './routes/comercios.js';
import packRoutes from './routes/packs.js';
import pedidoRoutes from './routes/pedidos.js';
import slotRoutes from './routes/slots.js';
import pagoRoutes from './routes/pagos.js';
import otpRoutes from './routes/otpRoutes.js'; // Rutas de OTP

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de seguridad
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://10.215.186.158:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://10.215.186.158:3000'];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

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

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
app.get('/api/health', async (req, res) => {
  try {
    await testConnection();
    res.json({
      status: 'ok',
      message: 'Conexión a la base de datos exitosa',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Error de conexión a la base de datos:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error de conexión a la base de datos',
      error: error.message
    });
  }
});

// Conectar a Redis antes de iniciar el servidor
const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('✅ Redis conectado exitosamente');
  } catch (error) {
    console.error('❌ Error conectando a Redis:', error);
    process.exit(1);
  }
};

// Inicializar la conexión a Redis
connectRedis();

// Middleware para adjuntar redis a las solicitudes
app.use(attachRedis);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comercios', comercioRoutes);
app.use('/api/packs', packRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/otp', otpRoutes); // Rutas de OTP

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Servir archivos estáticos del frontend en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../build', 'index.html'));
  });
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
    // Cerrar conexión a Redis
    if (redisClient.isOpen) {
      await redisClient.quit();
      console.log('✅ Conexión a Redis cerrada');
    }
    
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
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
      console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
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
          throw error;
      }
    });
    
    return server;
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Iniciar el servidor solo si se ejecuta directamente
if (require.main === module) {
  startServer();
}

// Exportar la aplicación para pruebas
export default app;
