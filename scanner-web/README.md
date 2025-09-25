# TuGood TuGo - Scanner Web para Restaurantes

Este es el scanner web que permite a los restaurantes confirmar pedidos escaneando códigos QR desde cualquier dispositivo móvil.

## 🚀 Despliegue en Netlify

### Opción 1: Drag & Drop
1. Ve a [netlify.com](https://netlify.com)
2. Arrastra la carpeta `scanner-web` a la zona de despliegue
3. Netlify te dará una URL como `https://amazing-name-123456.netlify.app`
4. Actualiza la URL en `QRCodeModal.js` línea 31

### Opción 2: GitHub + Netlify
1. Sube la carpeta `scanner-web` a un repositorio de GitHub
2. Conecta el repositorio con Netlify
3. Configura el build:
   - Build command: (vacío)
   - Publish directory: `/`

## 📱 Cómo Funciona

1. **Cliente genera QR** → Contiene URL con datos encriptados
2. **Restaurante escanea** → Se abre automáticamente en el navegador
3. **Pantalla de confirmación** → Muestra toda la información del pedido
4. **Confirma entrega** → Marca el pedido como completado

## 🔧 Configuración

Para usar tu propia URL, actualiza la línea 31 en `src/components/QRCodeModal.js`:

```javascript
const webScannerUrl = `https://TU-URL-AQUI.netlify.app/?data=${dataEncoded}`;
```

## ✨ Características

- ✅ **Funciona sin apps** - Solo navegador web
- ✅ **Responsive** - Optimizado para móviles
- ✅ **Offline-ready** - Se carga una vez y funciona
- ✅ **Seguro** - Datos encriptados en Base64
- ✅ **Profesional** - Diseño moderno para restaurantes

## 🎯 Estados de la Aplicación

1. **Loading** - Verificando pedido (1.5s)
2. **Error** - Si el QR no es válido
3. **Confirmación** - Información completa del pedido
4. **Éxito** - Pedido marcado como entregado

## 📊 Datos del QR

El QR contiene una URL con datos Base64 encodificados:

```
https://tugoodtugo-scanner.netlify.app/?data=eyJ0aXBvIjoiQ09ORklSTUFDSU9OX1BFRElETyI...
```

Los datos decodificados incluyen:
- Tipo de confirmación
- ID del pedido
- Código de seguridad
- Información del comercio
- Total y fecha
- Cliente

## 🔒 Seguridad

- Datos encriptados en Base64
- Validación de tipo de pedido
- Timestamp para validez temporal
- No almacena información sensible
