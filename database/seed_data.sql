-- Datos de prueba para TuGood TuGo
-- Insertar datos iniciales para desarrollo y testing

-- Insertar usuarios de prueba (clientes)
INSERT INTO usuarios (nombre, email, password_hash, rol, telefono, google_id) VALUES
('María González', 'maria@gmail.com', '$2b$10$example_hash_cliente', 'cliente', '+57 300 123 4567', 'google_123'),
('Carlos Rodríguez', 'carlos@gmail.com', '$2b$10$example_hash_cliente', 'cliente', '+57 301 234 5678', 'google_456'),
('Ana Martínez', 'ana@gmail.com', '$2b$10$example_hash_cliente', 'cliente', '+57 302 345 6789', NULL),
('Admin TuGood', 'admin@tugood.com', '$2b$10$example_hash_admin', 'admin', '+57 601 789 0123', NULL);

-- Insertar usuarios comercio (el trigger creará automáticamente el registro en comercios)
INSERT INTO usuarios (nombre, email, password_hash, rol, telefono) VALUES
('Panadería San Miguel', 'panaderia@sanmiguel.com', '$2b$10$example_hash_comercio', 'comercio', '+57 601 234 5678'),
('El Buen Corrientazo', 'info@corrientazo.com', '$2b$10$example_hash_comercio', 'comercio', '+57 601 345 6789'),
('Supermercado Fresh', 'admin@fresh.com', '$2b$10$example_hash_comercio', 'comercio', '+57 601 456 7890'),
('Cafetería Central', 'contacto@central.com', '$2b$10$example_hash_comercio', 'comercio', '+57 601 567 8901'),
('Healthy Bowls', 'hola@healthybowls.com', '$2b$10$example_hash_comercio', 'comercio', '+57 601 678 9012');

-- Actualizar los comercios creados automáticamente con datos completos
UPDATE comercios SET 
    nombre = 'Panadería San Miguel',
    direccion = 'Calle 85 #15-20',
    barrio = 'Zona Rosa',
    zona_bogota = 'Chapinero',
    latitud = 4.6097,
    longitud = -74.0817,
    tipo_comercio = 'panadería',
    nit = '900123456-1',
    verificado = true,
    rating = 4.5,
    total_reviews = 25,
    horario_apertura = '06:00',
    horario_cierre = '20:00'
WHERE usuario_id = 5;

UPDATE comercios SET 
    nombre = 'El Buen Corrientazo',
    direccion = 'Carrera 13 #63-45',
    barrio = 'Chapinero Central',
    zona_bogota = 'Chapinero',
    latitud = 4.6351,
    longitud = -74.0669,
    tipo_comercio = 'corrientazo',
    nit = '900234567-2',
    verificado = true,
    rating = 4.2,
    total_reviews = 18,
    horario_apertura = '11:00',
    horario_cierre = '22:30'
WHERE usuario_id = 6;

UPDATE comercios SET 
    nombre = 'Supermercado Fresh',
    direccion = 'Calle 116 #7-30',
    barrio = 'Santa Bárbara',
    zona_bogota = 'Usaquén',
    latitud = 4.7110,
    longitud = -74.0721,
    tipo_comercio = 'supermercado',
    nit = '900345678-3',
    verificado = true,
    rating = 4.0,
    total_reviews = 32,
    horario_apertura = '07:00',
    horario_cierre = '21:00'
WHERE usuario_id = 7;

UPDATE comercios SET 
    nombre = 'Cafetería Central',
    direccion = 'Carrera 11 #93-15',
    barrio = 'Zona Rosa',
    zona_bogota = 'Chapinero',
    latitud = 4.6392,
    longitud = -74.0969,
    tipo_comercio = 'cafetería',
    nit = '900456789-4',
    verificado = true,
    rating = 4.3,
    total_reviews = 41,
    horario_apertura = '07:00',
    horario_cierre = '19:30'
WHERE usuario_id = 8;

UPDATE comercios SET 
    nombre = 'Healthy Bowls',
    direccion = 'Avenida Boyacá #72-15',
    barrio = 'Kennedy Central',
    zona_bogota = 'Kennedy',
    latitud = 4.6280,
    longitud = -74.1372,
    tipo_comercio = 'saludable',
    nit = '900567890-5',
    verificado = true,
    rating = 4.4,
    total_reviews = 15,
    horario_apertura = '08:00',
    horario_cierre = '23:00'
WHERE usuario_id = 9;

-- Insertar packs de prueba (usando los IDs de comercios creados automáticamente)
INSERT INTO packs (comercio_id, titulo, descripcion, precio_original, precio_descuento, cantidad, cantidad_disponible, hora_recogida_inicio, hora_recogida_fin, tipo_comida, tags) VALUES
((SELECT id FROM comercios WHERE usuario_id = 5), 'Pack Panadería Sorpresa', 'Pan artesanal y bollería del día anterior', 60000, 20000, 5, 3, '19:00', '20:00', 'panadería', ARRAY['pan', 'bollería', 'artesanal']),
((SELECT id FROM comercios WHERE usuario_id = 6), 'Almuerzo Corrientazo', 'Almuerzo completo con sopa, seco, arroz y jugo', 100000, 32000, 3, 2, '21:00', '22:30', 'corrientazo', ARRAY['almuerzo', 'completo', 'casero']),
((SELECT id FROM comercios WHERE usuario_id = 7), 'Frutas y Verduras Frescas', 'Selección de frutas y verduras próximas a vencer', 80000, 28000, 8, 5, '20:00', '21:00', 'frutas', ARRAY['frutas', 'verduras', 'fresco']),
((SELECT id FROM comercios WHERE usuario_id = 8), 'Café y Pastelería', 'Café premium y pasteles del día', 48000, 16000, 6, 4, '18:30', '19:30', 'cafetería', ARRAY['café', 'pasteles', 'premium']),
((SELECT id FROM comercios WHERE usuario_id = 9), 'Bowl Saludable Sorpresa', 'Bowl con ingredientes orgánicos y proteína', 72000, 24000, 4, 1, '22:00', '23:00', 'saludable', ARRAY['saludable', 'orgánico', 'proteína']);

-- Insertar algunos pedidos de prueba
INSERT INTO pedidos (usuario_id, pack_id, cantidad, estado, fecha_pedido, total) VALUES
(1, 1, 1, 'recogido', NOW() - INTERVAL '2 days', 20000),
(2, 2, 1, 'listo', NOW() - INTERVAL '1 hour', 32000),
(3, 3, 2, 'confirmado', NOW() - INTERVAL '30 minutes', 56000),
(1, 4, 1, 'pagado', NOW() - INTERVAL '15 minutes', 16000);

-- Insertar pagos correspondientes
INSERT INTO pagos (pedido_id, metodo, monto, estado, referencia_externa) VALUES
(1, 'nequi', 20000, 'completado', 'NEQ123456789'),
(2, 'tarjeta', 32000, 'completado', 'VISA987654321'),
(3, 'daviplata', 56000, 'completado', 'DAVI456789123'),
(4, 'pse', 16000, 'completado', 'PSE789123456');

-- Insertar reviews
INSERT INTO reviews (usuario_id, comercio_id, pedido_id, rating, comentario) VALUES
(1, 1, 1, 5, 'Excelente pan, muy fresco y a buen precio'),
(2, 2, 2, 4, 'Buena comida casera, porción generosa'),
(3, 3, 3, 4, 'Frutas en buen estado, gran variedad');

-- Insertar favoritos
INSERT INTO favoritos (usuario_id, comercio_id) VALUES
(1, 1),
(1, 4),
(2, 2),
(3, 3),
(3, 5);

-- Insertar configuraciones de usuario
INSERT INTO configuraciones_usuario (usuario_id, zona_preferida, radio_busqueda, tipos_comida_preferidos) VALUES
(1, 'Chapinero', 3, ARRAY['panadería', 'cafetería']),
(2, 'Usaquén', 5, ARRAY['corrientazo', 'saludable']),
(3, 'Kennedy', 2, ARRAY['supermercado', 'frutas']);

-- Insertar notificaciones de prueba
INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo) VALUES
(1, 'Nuevo pack disponible', 'Panadería San Miguel tiene un nuevo pack disponible', 'nuevo_pack'),
(2, 'Pedido listo para recoger', 'Tu pedido en El Buen Corrientazo está listo', 'pedido_listo'),
(3, 'Pedido confirmado', 'Tu pedido ha sido confirmado y procesado', 'pedido_confirmado');
