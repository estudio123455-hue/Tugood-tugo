# TuGood TuGo - Base de Datos PostgreSQL

## 📊 Esquema de Base de Datos

Este directorio contiene el esquema completo de la base de datos PostgreSQL para la aplicación TuGood TuGo.

### 🗂️ Archivos

- `schema.sql` - Estructura completa de tablas, índices y triggers
- `seed_data.sql` - Datos de prueba para desarrollo
- `README.md` - Esta documentación

### 🏗️ Estructura de Tablas

#### 1. **usuarios**
- Almacena clientes, comercios y administradores
- Soporte para autenticación OAuth (Google, Facebook, Apple)
- Campos: id, nombre, email, password_hash, rol, telefono, etc.

#### 2. **comercios**
- Información específica de negocios
- Ubicación con coordenadas de Bogotá
- Verificación y sistema de rating
- Campos: usuario_id, nombre, direccion, zona_bogota, latitud, longitud, etc.

#### 3. **packs**
- Ofertas de excedentes de comida
- Precios originales y con descuento
- Horarios de recogida
- Campos: comercio_id, titulo, precio_original, precio_descuento, etc.

#### 4. **pedidos**
- Reservas de packs por usuarios
- Estados: pendiente, confirmado, pagado, listo, recogido, cancelado
- Códigos QR únicos para recogida
- Campos: usuario_id, pack_id, cantidad, estado, codigo_qr, etc.

#### 5. **pagos**
- Transacciones de pago
- Soporte para métodos colombianos: Nequi, Daviplata, PSE
- Campos: pedido_id, metodo, monto, estado, referencia_externa, etc.

#### 6. **reviews**
- Calificaciones y comentarios de usuarios
- Sistema de rating de 1-5 estrellas
- Campos: usuario_id, comercio_id, rating, comentario, etc.

#### 7. **favoritos**
- Comercios favoritos de cada usuario
- Relación many-to-many entre usuarios y comercios

#### 8. **notificaciones**
- Sistema de notificaciones push
- Tipos: nuevo_pack, pedido_confirmado, pedido_listo, etc.

#### 9. **configuraciones_usuario**
- Preferencias personalizadas
- Zona preferida, radio de búsqueda, tipos de comida
- Configuración de notificaciones

### 🔗 Relaciones

```
usuarios (1) ──→ (N) comercios
comercios (1) ──→ (N) packs
usuarios (1) ──→ (N) pedidos
packs (1) ──→ (N) pedidos
pedidos (1) ──→ (1) pagos
usuarios (1) ──→ (N) reviews
comercios (1) ──→ (N) reviews
usuarios (N) ──→ (N) comercios (favoritos)
```

### 🚀 Instalación

#### 1. Instalar PostgreSQL
```bash
# Windows (usando chocolatey)
choco install postgresql

# O descargar desde: https://www.postgresql.org/download/windows/
```

#### 2. Crear base de datos
```sql
CREATE DATABASE tugood_tugo;
CREATE USER tugood_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE tugood_tugo TO tugood_user;
```

#### 3. Ejecutar esquema
```bash
psql -U tugood_user -d tugood_tugo -f schema.sql
```

#### 4. Cargar datos de prueba
```bash
psql -U tugood_user -d tugood_tugo -f seed_data.sql
```

### 🔧 Configuración para Node.js

#### Instalar dependencias
```bash
npm install pg pg-hstore sequelize
# o
npm install prisma @prisma/client
```

#### Variables de entorno (.env)
```env
DATABASE_URL=postgresql://tugood_user:tu_password@localhost:5432/tugood_tugo
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tugood_tugo
DB_USER=tugood_user
DB_PASSWORD=tu_password_seguro
```

### 📍 Zonas de Bogotá Soportadas

- Chapinero
- Usaquén  
- Teusaquillo
- Kennedy
- Zona Rosa
- La Candelaria
- Suba
- Engativá

### 🏪 Tipos de Comercio

- panadería
- restaurante
- supermercado
- cafetería
- corrientazo
- saludable
- comida rápida

### 💳 Métodos de Pago

- tarjeta (Visa, Mastercard)
- nequi
- daviplata
- pse
- paypal
- efectivo

### 🔍 Índices Optimizados

- Búsqueda por email de usuarios
- Filtrado por zona de Bogotá
- Consultas por tipo de comercio
- Búsqueda geográfica (latitud, longitud)
- Filtros por estado de pedidos
- Consultas por fecha

### ⚡ Triggers Automáticos

- **Actualización de rating**: Recalcula automáticamente el rating promedio de comercios cuando se agrega una nueva review
- **Generación de QR**: Crea códigos QR únicos para cada pedido automáticamente

### 🧪 Datos de Prueba Incluidos

- 9 usuarios (3 clientes, 5 comercios, 1 admin)
- 5 comercios verificados en diferentes zonas
- 5 packs activos con diferentes tipos de comida
- 4 pedidos en diferentes estados
- Reviews y favoritos de ejemplo
- Configuraciones de usuario personalizadas

### 🔐 Seguridad

- Passwords hasheados con bcrypt
- Constraints de integridad referencial
- Validación de roles y estados
- Índices para optimizar consultas

### 📱 Integración con la App

Esta base de datos reemplaza el `localStorage` actual y proporciona:

- ✅ Persistencia real de datos
- ✅ Múltiples usuarios simultáneos  
- ✅ Sincronización en tiempo real
- ✅ Búsquedas avanzadas
- ✅ Sistema de notificaciones
- ✅ Analytics y reportes
- ✅ Backup y recuperación
