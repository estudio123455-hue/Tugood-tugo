-- Ejemplo de Auto-Registro para TuGood TuGo
-- Demuestra cómo funciona el trigger automático para comercios

-- ========================================
-- EJEMPLO 1: Registro de Cliente Normal
-- ========================================
-- Solo se crea en la tabla usuarios, NO en comercios

INSERT INTO usuarios (nombre, email, password_hash, rol, telefono) 
VALUES ('Juan Pérez', 'juan@gmail.com', '$2b$10$hash_cliente', 'cliente', '+57 300 111 2222');

-- Resultado: 
-- ✅ Se crea en usuarios con rol = 'cliente'
-- ❌ NO se crea nada en comercios (porque no es comercio)

-- ========================================
-- EJEMPLO 2: Registro de Comercio
-- ========================================
-- Se crea en usuarios Y automáticamente en comercios

INSERT INTO usuarios (nombre, email, password_hash, rol, telefono) 
VALUES ('Restaurante El Sabor', 'info@elsabor.com', '$2b$10$hash_comercio', 'comercio', '+57 601 333 4444');

-- Resultado automático del TRIGGER:
-- ✅ Se crea en usuarios con rol = 'comercio'
-- ✅ Se crea AUTOMÁTICAMENTE en comercios con datos placeholder:
--     - usuario_id: [ID del usuario recién creado]
--     - nombre: 'Nombre pendiente'
--     - direccion: 'Dirección pendiente'
--     - barrio: 'Pendiente'
--     - zona_bogota: 'Chapinero' (por defecto)
--     - verificado: FALSE

-- ========================================
-- EJEMPLO 3: Completar Perfil de Comercio
-- ========================================
-- El comercio luego completa su perfil actualizando la tabla comercios

UPDATE comercios SET 
    nombre = 'Restaurante El Sabor',
    direccion = 'Carrera 15 #85-20',
    barrio = 'Zona Rosa',
    zona_bogota = 'Chapinero',
    latitud = 4.6486,
    longitud = -74.0648,
    tipo_comercio = 'restaurante',
    nit = '900888999-7',
    horario_apertura = '12:00',
    horario_cierre = '22:00'
WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'info@elsabor.com');

-- ========================================
-- VERIFICAR FUNCIONAMIENTO
-- ========================================

-- Ver todos los usuarios y sus comercios asociados
SELECT 
    u.id as usuario_id,
    u.nombre as usuario_nombre,
    u.rol,
    c.id as comercio_id,
    c.nombre as comercio_nombre,
    c.verificado
FROM usuarios u
LEFT JOIN comercios c ON u.id = c.usuario_id
ORDER BY u.id;

-- Ver solo comercios con datos pendientes (recién registrados)
SELECT 
    u.nombre as usuario,
    u.email,
    c.nombre as comercio_nombre,
    c.direccion,
    c.verificado
FROM usuarios u
JOIN comercios c ON u.id = c.usuario_id
WHERE c.nombre = 'Nombre pendiente'
   OR c.direccion = 'Dirección pendiente';

-- ========================================
-- FLUJO COMPLETO EN LA APLICACIÓN
-- ========================================

/*
1. REGISTRO CLIENTE:
   - Usuario llena formulario con rol = 'cliente'
   - Se crea solo en tabla usuarios
   - Puede usar la app inmediatamente

2. REGISTRO COMERCIO:
   - Usuario llena formulario con rol = 'comercio'  
   - Se crea en usuarios
   - TRIGGER crea automáticamente registro en comercios (datos placeholder)
   - Comercio ve mensaje: "Completa tu perfil para empezar a vender"

3. COMPLETAR PERFIL COMERCIO:
   - Comercio accede a "Mi Perfil" o "Configurar Negocio"
   - Llena formulario con: nombre, dirección, zona, tipo, NIT, horarios
   - Se actualiza el registro en comercios
   - Una vez verificado, puede crear packs

4. VERIFICACIÓN:
   - Admin revisa datos del comercio
   - Cambia verificado = TRUE
   - Comercio puede empezar a vender packs
*/
