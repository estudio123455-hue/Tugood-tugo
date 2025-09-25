# Configuración de Base de Datos para TuGood TuGo

## Opción 1: PostgreSQL Local (Recomendado para desarrollo)

### Instalar PostgreSQL en Windows:

1. **Descargar PostgreSQL:**
   - Ir a https://www.postgresql.org/download/windows/
   - Descargar el instalador para Windows
   - Ejecutar e instalar con configuración por defecto

2. **Configurar después de instalación:**
```bash
# Abrir Command Prompt como administrador
# Navegar a la carpeta bin de PostgreSQL (usualmente):
cd "C:\Program Files\PostgreSQL\15\bin"

# Crear usuario y base de datos
createuser -U postgres tugood_user --pwprompt
# Cuando pida contraseña, usar: tugood123

createdb -U postgres -O tugood_user tugood_tugo
```

3. **Ejecutar esquemas:**
```bash
# Desde la carpeta del proyecto
psql -U tugood_user -d tugood_tugo -f database/schema.sql
psql -U tugood_user -d tugood_tugo -f database/seed_data.sql
```

## Opción 2: Docker (Más fácil)

1. **Instalar Docker Desktop para Windows**
2. **Ejecutar PostgreSQL en contenedor:**

```bash
# Crear y ejecutar contenedor PostgreSQL
docker run --name tugood-postgres \
  -e POSTGRES_DB=tugood_tugo \
  -e POSTGRES_USER=tugood_user \
  -e POSTGRES_PASSWORD=tugood123 \
  -p 5432:5432 \
  -d postgres:15

# Esperar unos segundos y ejecutar esquemas
docker exec -i tugood-postgres psql -U tugood_user -d tugood_tugo < database/schema.sql
docker exec -i tugood-postgres psql -U tugood_user -d tugood_tugo < database/seed_data.sql
```

## Opción 3: Base de Datos en la Nube (Más rápido para testing)

### Supabase (Gratis):
1. Ir a https://supabase.com
2. Crear cuenta y proyecto
3. En Settings > Database, copiar connection string
4. Actualizar `.env` con la URL de conexión

### Railway (Gratis):
1. Ir a https://railway.app
2. Crear proyecto con PostgreSQL
3. Copiar variables de conexión
4. Actualizar `.env`

## Verificar Conexión

Después de configurar, ejecutar:
```bash
cd backend
npm run dev
```

Deberías ver:
```
✅ Conectado a PostgreSQL exitosamente
🚀 Servidor corriendo en puerto 5000
```

## Troubleshooting

- **Error de conexión:** Verificar que PostgreSQL esté corriendo
- **Error de autenticación:** Verificar credenciales en `.env`
- **Puerto ocupado:** Cambiar PORT en `.env`
