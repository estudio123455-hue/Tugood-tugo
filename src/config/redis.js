import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: 0,
  retryStrategy: (times) => {
    // Reintentar hasta 3 veces
    if (times <= 3) {
      return 500; // Reintentar después de 500ms
    }
    return null; // Dejar de reintentar después de 3 intentos
  },
  maxRetriesPerRequest: 3,
};

const redis = new Redis(redisConfig);

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

export default redis;

redis.on('connect', () => {
  console.log('Connected to Redis');
});
