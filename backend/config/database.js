import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

// Importar el módulo de SQLite
const sqliteModule = await import('./database-sqlite.js');

// Configuración de la base de datos SQLite
const dbModule = {
  query: (text, params) => sqliteModule.query(text, params),
  transaction: (callback) => sqliteModule.transaction(callback),
  testConnection: () => sqliteModule.testConnection()
};

// Función para probar la conexión
const testConnection = async () => {
  try {
    const result = await dbModule.testConnection();
    console.log('✅ Conexión a SQLite exitosa');
    if (result && result.test) {
      console.log('🕐 Test de conexión exitoso');
    }
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos SQLite:', error.message);
    console.error('❌ No se pudo conectar a la base de datos');
    return false;
  }
};

export const query = dbModule.query;
export const transaction = dbModule.transaction;
export { testConnection };

export default {
  query: dbModule.query,
  transaction: dbModule.transaction,
  testConnection
};
