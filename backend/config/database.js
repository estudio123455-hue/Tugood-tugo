require('dotenv').config();

// Use SQLite for development if PostgreSQL is not available
const useSQLite = process.env.USE_SQLITE === 'true' || !process.env.DATABASE_URL;

let dbModule;

if (useSQLite) {
  console.log('🔄 Usando SQLite para desarrollo');
  dbModule = require('./database-sqlite');
} else {
  console.log('🔄 Usando PostgreSQL');
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  dbModule = {
    query: async (text, params) => {
      const client = await pool.connect();
      try {
        const result = await client.query(text, params);
        return result;
      } finally {
        client.release();
      }
    },

    transaction: async (callback) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },

    testConnection: async () => {
      try {
        const result = await pool.query('SELECT NOW()');
        return result.rows[0];
      } catch (error) {
        throw error;
      }
    }
  };
}

// Función para probar la conexión
const testConnection = async () => {
  try {
    const result = await dbModule.testConnection();
    console.log('✅ Conexión a base de datos exitosa');
    if (result.now) {
      console.log('🕐 Hora del servidor:', result.now);
    } else if (result.test) {
      console.log('🕐 Test de conexión exitoso');
    }
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    console.error('❌ No se pudo conectar a la base de datos');
    return false;
  }
};

module.exports = {
  query: dbModule.query,
  transaction: dbModule.transaction,
  testConnection
};
