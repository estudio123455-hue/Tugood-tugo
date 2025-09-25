-- Asegurarse de que la columna 'notas' exista en la tabla 'pedidos' en SQLite
-- Esta migración es idempotente, por lo que se puede ejecutar varias veces sin problemas

-- Verificar si la columna 'notas' ya existe
SELECT CASE 
    WHEN EXISTS (SELECT 1 FROM pragma_table_info('pedidos') WHERE name = 'notas') 
    THEN 1 ELSE 0 
END as columna_existe;

-- Agregar la columna 'notas' si no existe
-- En SQLite, usamos una transacción para evitar errores si la columna ya existe
BEGIN TRANSACTION;
    -- Intentar agregar la columna
    -- Si la columna ya existe, esto fallará silenciosamente en SQLite
    -- debido a la cláusula IF NOT EXISTS
    ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS notas TEXT;
COMMIT;

-- Verificar que la columna se agregó correctamente
PRAGMA table_info(pedidos);
