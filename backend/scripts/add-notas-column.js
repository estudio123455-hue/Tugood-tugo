const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta a la base de datos SQLite
const dbPath = path.join(__dirname, '../../tugood.db');
console.log(`📂 Verificando base de datos en: ${dbPath}`);

// Conectar a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar a la base de datos:', err.message);
    return;
  }
  
  console.log('✅ Conectado a la base de datos SQLite');
  
  // Verificar si la columna 'notas' existe en la tabla 'pedidos'
  db.get(
    "SELECT name FROM pragma_table_info('pedidos') WHERE name = 'notas';",
    [],
    (err, row) => {
      if (err) {
        console.error('❌ Error al verificar la columna notas:', err.message);
        db.close();
        return;
      }
      
      if (row) {
        console.log('✅ La columna notas ya existe en la tabla pedidos');
        db.close();
      } else {
        console.log('🔄 La columna notas no existe. Agregando...');
        
        // Agregar la columna 'notas' a la tabla 'pedidos'
        db.run(
          'ALTER TABLE pedidos ADD COLUMN notas TEXT;',
          function(err) {
            if (err) {
              console.error('❌ Error al agregar la columna notas:', err.message);
            } else {
              console.log('✅ Columna notas agregada correctamente a la tabla pedidos');
            }
            db.close();
          }
        );
      }
    }
  );
});
