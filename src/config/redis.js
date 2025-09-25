import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Configuración para desarrollo local
const isProduction = process.env.NODE_ENV === 'production';
let redisClient;

if (isProduction && process.env.REDIS_URL) {
  // Configuración para producción (Upstash)
  const redisUrl = new URL(process.env.REDIS_URL);
  
  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      tls: true,
      rejectUnauthorized: false
    }
  });
} else {
  // Configuración para desarrollo local
  redisClient = createClient({
    url: 'redis://localhost:6379'
  });
}

// Manejar eventos de conexión
redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Conectar a Redis
(async () => {
  try {
    await redisClient.connect();
    console.log('Redis client connected');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
})();

export default redisClient;
