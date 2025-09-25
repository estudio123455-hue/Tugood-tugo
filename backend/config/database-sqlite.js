const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create or connect to persistent database file
const dbPath = path.join(__dirname, '../../tugood.db');
console.log(`📂 Usando base de datos SQLite en: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error creando base de datos SQLite:', err.message);
  } else {
    console.log('✅ Base de datos SQLite en memoria creada');
    initializeSchema();
  }
});

// Initialize database schema
function initializeSchema() {
  const schema = `
    -- Usuarios table
    CREATE TABLE usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nombre TEXT NOT NULL,
      telefono TEXT,
      avatar_url TEXT,
      rol TEXT CHECK(rol IN ('cliente', 'comercio', 'admin')) DEFAULT 'cliente',
      fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
      activo BOOLEAN DEFAULT true
    );

    -- Comercios table
    CREATE TABLE comercios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      direccion TEXT NOT NULL,
      barrio TEXT,
      zona_bogota TEXT NOT NULL,
      latitud DECIMAL(10,8),
      longitud DECIMAL(11,8),
      tipo_comercio TEXT NOT NULL,
      telefono TEXT,
      horario_apertura TIME,
      horario_cierre TIME,
      rating DECIMAL(3,2) DEFAULT 0.00,
      total_reviews INTEGER DEFAULT 0,
      imagen_url TEXT,
      verificado BOOLEAN DEFAULT true,
      activo BOOLEAN DEFAULT true,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    -- Configuraciones de usuario
    CREATE TABLE IF NOT EXISTS configuraciones_usuario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER UNIQUE NOT NULL,
      notificaciones_push BOOLEAN DEFAULT 1,
      notificaciones_email BOOLEAN DEFAULT 1,
      zona_preferida TEXT,
      radio_busqueda INTEGER DEFAULT 5,
      tipos_comida_preferidos TEXT,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    -- Crear configuración para usuarios existentes
    INSERT OR IGNORE INTO configuraciones_usuario (usuario_id)
    SELECT id FROM usuarios
    WHERE id NOT IN (SELECT usuario_id FROM configuraciones_usuario);

    -- Packs table
    CREATE TABLE IF NOT EXISTS packs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comercio_id INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      precio_original DECIMAL(10,2) NOT NULL,
      precio_descuento DECIMAL(10,2) NOT NULL,
      cantidad_disponible INTEGER NOT NULL,
      hora_recogida_inicio TIME NOT NULL,
      hora_recogida_fin TIME NOT NULL,
      fecha_disponible DATE NOT NULL,
      imagen_url TEXT,
      tipo_comida TEXT,
      tags TEXT,
      fecha_publicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      activo BOOLEAN DEFAULT true,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (comercio_id) REFERENCES comercios(id)
    );

    -- Pedidos table
    CREATE TABLE pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      pack_id INTEGER NOT NULL,
      cantidad INTEGER NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      estado TEXT CHECK(estado IN ('pendiente', 'confirmado', 'pagado', 'listo', 'entregado', 'cancelado')) DEFAULT 'pendiente',
      codigo_qr TEXT UNIQUE,
      fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (pack_id) REFERENCES packs(id)
    );

    -- Pagos table
    CREATE TABLE pagos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER UNIQUE NOT NULL,
      metodo TEXT NOT NULL,
      monto DECIMAL(10,2) NOT NULL,
      estado TEXT CHECK(estado IN ('pendiente', 'completado', 'fallido', 'reembolsado')) DEFAULT 'pendiente',
      referencia_externa TEXT,
      datos_pago TEXT,
      fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    );

    -- Slots (franjas horarias) por comercio/pack
    CREATE TABLE IF NOT EXISTS slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comercio_id INTEGER NOT NULL,
      titulo TEXT,
      descripcion TEXT,
      fecha DATE NOT NULL,
      hora_inicio TIME NOT NULL,
      hora_fin TIME NOT NULL,
      capacidad INTEGER NOT NULL,
      disponible INTEGER NOT NULL,
      precio_descuento DECIMAL(10,2),
      pack_id INTEGER,
      activo BOOLEAN DEFAULT 1,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (comercio_id) REFERENCES comercios(id),
      FOREIGN KEY (pack_id) REFERENCES packs(id)
    );
  `;

  db.exec(schema, (err) => {
    if (err) {
      console.error('❌ Error creando esquema:', err.message);
    } else {
      console.log('✅ Esquema de base de datos creado');
      insertSeedData();
    }
  });
}

// Insert seed data
function insertSeedData() {
  const seedData = `
    -- Insert test users
    INSERT INTO usuarios (email, password_hash, nombre, telefono, rol) VALUES
    ('cliente@test.com', '$2b$10$example_hash_cliente', 'Juan Cliente', '3001234567', 'cliente'),
    ('panaderia@test.com', '$2b$10$example_hash_panaderia', 'Panadería El Buen Pan', '3007654321', 'comercio'),
    ('restaurante@test.com', '$2b$10$example_hash_restaurante', 'Restaurante La Sazón', '3009876543', 'comercio'),
    ('admin@test.com', '$2b$10$example_hash_admin', 'Admin TuGood', '3001111111', 'admin');

    -- Insert comercios
    INSERT INTO comercios (usuario_id, nombre, descripcion, direccion, barrio, zona_bogota, latitud, longitud, tipo_comercio, telefono, horario_apertura, horario_cierre, rating, imagen_url, verificado) VALUES
    (2, 'Panadería El Buen Pan', 'Panadería artesanal con productos frescos', 'Calle 85 #15-20', 'Zona Rosa', 'Chapinero', 4.6709, -74.0583, 'panadería', '3007654321', '06:00', '20:00', 4.5, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', true),
    (3, 'Restaurante La Sazón', 'Comida casera y corrientazos', 'Carrera 13 #45-30', 'Teusaquillo Centro', 'Teusaquillo', 4.6351, -74.0669, 'restaurante', '3009876543', '11:00', '22:00', 4.2, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', true);

    -- Insert packs
    INSERT INTO packs (comercio_id, titulo, descripcion, precio_original, precio_descuento, cantidad_disponible, hora_recogida_inicio, hora_recogida_fin, fecha_disponible, imagen_url, tipo_comida, tags, fecha_publicacion) VALUES
    (1, 'Pack Sorpresa Panadería', 'Pan, pasteles y productos de panadería del día', 15000, 8000, 5, '18:00', '20:00', date('now'), 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', 'panadería', 'pan,pasteles,dulces', datetime('now')),
    (2, 'Corrientazo Sorpresa', 'Almuerzo completo con sopa, seco, arroz y jugo', 12000, 6000, 3, '14:00', '16:00', date('now'), 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', 'corrientazo', 'almuerzo,casero,completo', datetime('now'));
  `;

  db.exec(seedData, (err) => {
    if (err) {
      console.error('❌ Error insertando datos de prueba:', err.message);
    } else {
      console.log('✅ Datos de prueba insertados');
    }
  });
}

// Query function compatible with PostgreSQL style
function query(text, params = []) {
  return new Promise((resolve, reject) => {
    db.all(text, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve({ rows });
      }
    });
  });
}

// Transaction function
function transaction(callback) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      const client = {
        query: (text, params = []) => {
          return new Promise((resolve, reject) => {
            db.all(text, params, (err, rows) => {
              if (err) reject(err);
              else resolve({ rows });
            });
          });
        }
      };

      callback(client)
        .then(result => {
          db.run('COMMIT', (err) => {
            if (err) reject(err);
            else resolve(result);
          });
        })
        .catch(error => {
          db.run('ROLLBACK', () => {
            reject(error);
          });
        });
    });
  });
}

// Test connection
function testConnection() {
  return new Promise((resolve, reject) => {
    db.get('SELECT 1 as test', (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

module.exports = {
  query,
  transaction,
  testConnection,
  db
};
