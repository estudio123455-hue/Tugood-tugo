-- TuGood TuGo Database Schema (PostgreSQL)
-- Base de datos para la aplicación de excedentes de comida en Bogotá

-- 1. Tabla de usuarios (clientes, comercios, administradores)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rol VARCHAR(20) CHECK (rol IN ('cliente','comercio','admin')) NOT NULL,
    telefono VARCHAR(20),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    avatar_url TEXT,
    google_id VARCHAR(100),
    facebook_id VARCHAR(100),
    apple_id VARCHAR(100)
);

-- 2. Tabla de comercios (información específica de negocios)
CREATE TABLE comercios (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT NOT NULL,
    barrio VARCHAR(100),
    zona_bogota VARCHAR(50) CHECK (zona_bogota IN ('Chapinero','Usaquén','Teusaquillo','Kennedy','Zona Rosa','La Candelaria','Suba','Engativá')),
    latitud DECIMAL(10,8),
    longitud DECIMAL(11,8),
    tipo_comercio VARCHAR(50) CHECK (tipo_comercio IN ('panadería','restaurante','supermercado','cafetería','corrientazo','saludable','comida rápida')),
    nit VARCHAR(20),
    camara_comercio VARCHAR(50),
    verificado BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    imagen_url TEXT,
    horario_apertura TIME,
    horario_cierre TIME,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de packs (ofertas de excedentes)
CREATE TABLE packs (
    id SERIAL PRIMARY KEY,
    comercio_id INT REFERENCES comercios(id) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio_original DECIMAL(10,2) NOT NULL,
    precio_descuento DECIMAL(10,2) NOT NULL,
    cantidad INT NOT NULL,
    cantidad_disponible INT NOT NULL,
    hora_recogida_inicio TIME NOT NULL,
    hora_recogida_fin TIME NOT NULL,
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATE,
    activo BOOLEAN DEFAULT TRUE,
    imagen_url TEXT,
    tipo_comida VARCHAR(50),
    tags TEXT[] -- Array de tags para búsqueda
);

-- 4. Tabla de pedidos (reservas de packs)
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    pack_id INT REFERENCES packs(id) ON DELETE CASCADE,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    estado VARCHAR(20) CHECK (estado IN ('pendiente','confirmado','pagado','listo','recogido','cancelado')) DEFAULT 'pendiente',
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_recogida TIMESTAMP,
    codigo_qr VARCHAR(100) UNIQUE,
    notas TEXT,
    total DECIMAL(10,2) NOT NULL
);

-- 5. Tabla de pagos
CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
    metodo VARCHAR(50) CHECK (metodo IN ('tarjeta','nequi','daviplata','pse','paypal','efectivo')),
    monto DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) CHECK (estado IN ('pendiente','completado','fallido','reembolsado')) DEFAULT 'pendiente',
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    referencia_externa VARCHAR(100), -- ID de transacción del proveedor de pago
    datos_pago JSONB -- Información adicional del pago
);

-- 6. Tabla de reviews/calificaciones
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    comercio_id INT REFERENCES comercios(id) ON DELETE CASCADE,
    pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comentario TEXT,
    fecha_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla de favoritos
CREATE TABLE favoritos (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    comercio_id INT REFERENCES comercios(id) ON DELETE CASCADE,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, comercio_id)
);

-- 8. Tabla de notificaciones
CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('nuevo_pack','pedido_confirmado','pedido_listo','promocion','sistema')),
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    datos_adicionales JSONB
);

-- 9. Tabla de configuraciones de usuario
CREATE TABLE configuraciones_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE UNIQUE,
    notificaciones_push BOOLEAN DEFAULT TRUE,
    notificaciones_email BOOLEAN DEFAULT TRUE,
    zona_preferida VARCHAR(50),
    radio_busqueda INT DEFAULT 5, -- en kilómetros
    tipos_comida_preferidos TEXT[],
    configuracion JSONB -- Configuraciones adicionales flexibles
);

-- Índices para optimizar consultas
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_comercios_zona ON comercios(zona_bogota);
CREATE INDEX idx_comercios_tipo ON comercios(tipo_comercio);
CREATE INDEX idx_comercios_verificado ON comercios(verificado);
CREATE INDEX idx_comercios_location ON comercios(latitud, longitud);
CREATE INDEX idx_packs_comercio ON packs(comercio_id);
CREATE INDEX idx_packs_activo ON packs(activo);
CREATE INDEX idx_packs_fecha ON packs(fecha_publicacion);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_fecha ON pedidos(fecha_pedido);
CREATE INDEX idx_pagos_pedido ON pagos(pedido_id);
CREATE INDEX idx_pagos_estado ON pagos(estado);

-- Triggers para actualizar rating de comercios
CREATE OR REPLACE FUNCTION actualizar_rating_comercio()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE comercios 
    SET rating = (
        SELECT AVG(rating)::DECIMAL(3,2) 
        FROM reviews 
        WHERE comercio_id = NEW.comercio_id
    ),
    total_reviews = (
        SELECT COUNT(*) 
        FROM reviews 
        WHERE comercio_id = NEW.comercio_id
    )
    WHERE id = NEW.comercio_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_rating
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_rating_comercio();

-- Función para crear comercio automáticamente cuando se registra un usuario con rol 'comercio'
CREATE OR REPLACE FUNCTION crear_comercio_auto()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rol = 'comercio' THEN
        INSERT INTO comercios (usuario_id, nombre, direccion, barrio, zona_bogota, verificado)
        VALUES (NEW.id, 'Nombre pendiente', 'Dirección pendiente', 'Pendiente', 'Chapinero', FALSE);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_crear_comercio
    AFTER INSERT ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION crear_comercio_auto();

-- Función para generar código QR único
CREATE OR REPLACE FUNCTION generar_codigo_qr()
RETURNS TRIGGER AS $$
BEGIN
    NEW.codigo_qr = 'TG' || TO_CHAR(NEW.fecha_pedido, 'YYYYMMDD') || LPAD(NEW.id::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_qr
    BEFORE INSERT ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION generar_codigo_qr();
