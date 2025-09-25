import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware básico
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido a la API de TuGood',
    version: '1.0.0',
    endpoints: {
      api: '/api',
      health: '/api/health'
    },
    documentation: 'URL_DE_LA_DOCUMENTACION'
  });
});

// Ruta de bienvenida de la API
app.get('/api', (req, res) => {
  res.json({
    message: 'Bienvenido a la API de TuGood',
    version: '1.0.0',
    endpoints: {
      root: '/',
      health: '/api/health'
    }
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Ruta de salud: http://localhost:${PORT}/api/health`);
  console.log('========================================\n');
});

// Manejar cierre limpio
process.on('SIGINT', () => {
  console.log('\n🔴 Recibida señal de terminación. Cerrando servidor...');
  process.exit(0);
});
