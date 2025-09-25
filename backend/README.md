# TuGood TuGo Backend API

Backend de Node.js para la aplicación TuGood TuGo - plataforma de excedentes de comida en Bogotá, Colombia.

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js >= 16.0.0
- PostgreSQL >= 12
- npm o yarn

### Instalación

1. **Clonar e instalar dependencias:**
```bash
cd backend
npm install
```

2. **Configurar base de datos:**
```bash
# Crear base de datos PostgreSQL
createdb tugood_tugo
createuser tugood_user --pwprompt

# Ejecutar esquema
psql -U tugood_user -d tugood_tugo -f ../database/schema.sql

# Cargar datos de prueba
psql -U tugood_user -d tugood_tugo -f ../database/seed_data.sql
```

3. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con tus credenciales de base de datos
```

4. **Iniciar servidor:**
```bash
npm run dev  # Desarrollo con nodemon
npm start    # Producción
```

El servidor estará disponible en `http://localhost:5000`

## 📊 API Endpoints

### Autenticación (`/api/auth`)
- `POST /register` - Registro de usuario (cliente/comercio)
- `POST /login` - Login con email/password
- `POST /google` - Login con Google OAuth
- `GET /me` - Perfil del usuario autenticado
- `POST /refresh` - Renovar token JWT

### Comercios (`/api/comercios`)
- `GET /` - Listar comercios con filtros
- `GET /:id` - Comercio específico
- `PUT /:id` - Actualizar comercio (solo dueño)
- `GET /me/profile` - Perfil del comercio autenticado
- `GET /zonas/list` - Zonas de Bogotá disponibles

### Packs (`/api/packs`)
- `GET /` - Listar packs con filtros
- `GET /:id` - Pack específico
- `POST /` - Crear pack (solo comercios)
- `PUT /:id` - Actualizar pack
- `DELETE /:id` - Eliminar pack
- `GET /me/list` - Packs del comercio autenticado

### Pedidos (`/api/pedidos`)
- `GET /` - Pedidos del usuario
- `GET /:id` - Pedido específico
- `POST /` - Crear pedido
- `PUT /:id/cancelar` - Cancelar pedido
- `GET /comercio/list` - Pedidos del comercio
- `PUT /:id/estado` - Actualizar estado

### Pagos (`/api/pagos`)
- `POST /` - Procesar pago
- `GET /pedido/:id` - Pago de un pedido
- `GET /historial` - Historial de pagos
- `GET /metodos` - Métodos disponibles

### Usuarios (`/api/users`)
- `GET /profile` - Perfil completo
- `PUT /profile` - Actualizar perfil
- `PUT /configuraciones` - Preferencias
- `GET /favoritos` - Comercios favoritos
- `GET /notificaciones` - Notificaciones

## 🔐 Autenticación

La API usa JWT (JSON Web Tokens) para autenticación. Incluye el token en el header:

```
Authorization: Bearer <token>
```

## 🏪 Roles de Usuario

- **cliente**: Puede comprar packs, ver comercios, hacer pedidos
- **comercio**: Puede crear packs, gestionar pedidos, ver estadísticas
- **admin**: Acceso completo a todas las funciones

## 💳 Métodos de Pago Soportados

- Tarjeta de crédito/débito
- Nequi
- Daviplata
- PSE
- PayPal (próximamente)

## 🗺️ Zonas de Bogotá

- Chapinero
- Usaquén
- Teusaquillo
- Kennedy
- Zona Rosa
- La Candelaria
- Suba
- Engativá

## 📱 Tipos de Comercio

- panadería
- restaurante
- supermercado
- cafetería
- corrientazo
- saludable
- comida rápida

## 🔧 Scripts Disponibles

- `npm start` - Iniciar servidor en producción
- `npm run dev` - Iniciar servidor en desarrollo con nodemon
- `npm test` - Ejecutar tests
- `npm run migrate` - Ejecutar migraciones de BD
- `npm run seed` - Cargar datos de prueba

## 🛡️ Seguridad

- Rate limiting (100 requests/15min por IP)
- Helmet.js para headers de seguridad
- Validación de entrada con express-validator
- Autenticación JWT
- Hashing de passwords con bcrypt
- CORS configurado

## 📈 Monitoreo

- Health check: `GET /health`
- Logs con Morgan
- Manejo de errores centralizado

## 🧪 Testing

```bash
npm test
```

## 📝 Variables de Entorno

Ver `.env.example` para todas las variables disponibles.

## 🚀 Despliegue

Para producción, asegúrate de:
1. Configurar `NODE_ENV=production`
2. Usar HTTPS
3. Configurar variables de entorno seguras
4. Configurar base de datos de producción
5. Configurar dominio en CORS

## 🤝 Contribuir

1. Fork el proyecto
2. Crear branch para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles.
