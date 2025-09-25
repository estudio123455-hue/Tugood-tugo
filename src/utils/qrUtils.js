// QR Utils - Sistema de Verificación Universal
// Genera códigos QR con URLs públicas para verificación de pedidos

// URL base de producción - cambiar por tu dominio
const BASE_URL = 'https://tugood-tugo.vercel.app';

/**
 * Genera un token único para el pedido
 * @param {string} pedidoId - ID del pedido
 * @returns {string} Token único
 */
export const generateQRToken = (pedidoId) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${pedidoId}-${random}`;
};

/**
 * Genera un código de seguridad alfanumérico
 * @returns {string} Código de 6 caracteres
 */
export const generateSecurityCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Crea los datos completos para el QR
 * @param {Object} pedido - Datos del pedido
 * @returns {Object} Datos para el QR
 */
export const createQRData = (pedido) => {
  const token = generateQRToken(pedido.id);
  const securityCode = pedido.codigo_seguridad || generateSecurityCode();
  
  return {
    pedidoId: pedido.id,
    comercio: pedido.comercio_nombre,
    codigo: securityCode,
    total: pedido.total,
    token: token,
    timestamp: Date.now(),
    cliente: pedido.cliente_nombre || 'Cliente',
    items: pedido.items?.length || 1,
    direccion: pedido.comercio_direccion,
    telefono: pedido.comercio_telefono
  };
};

/**
 * Genera la URL de verificación para el QR
 * @param {Object} qrData - Datos del QR
 * @returns {string} URL completa de verificación
 */
export const generateVerificationURL = (qrData) => {
  // Codificar datos en base64
  const encodedData = btoa(JSON.stringify(qrData));
  return `${BASE_URL}/verificar/${encodedData}`;
};

/**
 * Decodifica los datos del QR desde la URL
 * @param {string} encodedData - Datos codificados
 * @returns {Object|null} Datos decodificados o null si hay error
 */
export const decodeQRData = (encodedData) => {
  try {
    const decodedString = atob(encodedData);
    const data = JSON.parse(decodedString);
    return data;
  } catch (error) {
    console.error('Error decodificando datos QR:', error);
    return null;
  }
};

/**
 * Valida si el QR es válido (no expirado)
 * @param {Object} qrData - Datos del QR
 * @param {number} maxAge - Edad máxima en horas (default: 24)
 * @returns {boolean} True si es válido
 */
export const isValidQR = (qrData, maxAge = 24) => {
  if (!qrData || !qrData.timestamp) return false;
  
  const now = Date.now();
  const maxAgeMs = maxAge * 60 * 60 * 1000; // Convertir horas a ms
  
  return (now - qrData.timestamp) < maxAgeMs;
};

/**
 * Formatea el tiempo restante de validez del QR
 * @param {Object} qrData - Datos del QR
 * @returns {string} Tiempo restante formateado
 */
export const getQRTimeRemaining = (qrData) => {
  if (!qrData || !qrData.timestamp) return 'Expirado';
  
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 horas
  const timeLeft = maxAge - (now - qrData.timestamp);
  
  if (timeLeft <= 0) return 'Expirado';
  
  const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
  const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
  
  if (hoursLeft > 0) {
    return `${hoursLeft}h ${minutesLeft}m`;
  } else {
    return `${minutesLeft}m`;
  }
};

/**
 * Datos de ejemplo para testing
 */
export const sampleQRData = {
  pedidoId: 'demo-001',
  comercio: 'Supermercado Fresh',
  codigo: 'A3X9K2',
  total: 20000,
  token: generateQRToken('demo-001'),
  timestamp: Date.now(),
  cliente: 'Usuario Demo',
  items: 1,
  direccion: 'Calle 85 #12-34, Zona Rosa',
  telefono: '+57 302 345 6789'
};

// Función helper para testing
export const generateSampleQR = () => {
  const data = { ...sampleQRData, token: generateQRToken('demo-001'), timestamp: Date.now() };
  return generateVerificationURL(data);
};
