// API Service para TuGood TuGo
// Maneja todas las comunicaciones con el backend

import { mockApiService } from './mockApi';

// Obtener URL base del API dinámicamente
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Flag para usar mock API cuando el backend no esté disponible
let USE_MOCK_API = false;

/**
 * Maneja las respuestas de la API
 * @param {Response} response - Objeto Response de fetch
 * @returns {Promise<any>} Datos de la respuesta
 * @throws {Error} Si hay un error en la respuesta
 */
const handleResponse = async (response) => {
  // Verificar si la respuesta es vacía (sin contenido)
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  
  let data;
  try {
    data = isJson ? await response.json() : {};
  } catch (error) {
    console.error('Error al parsear respuesta JSON:', error);
    const text = await response.text().catch(() => 'No se pudo obtener el mensaje de error');
    console.error('Contenido de la respuesta:', text);
    
    const errorMessage = `Error al procesar la respuesta del servidor: ${response.status} ${response.statusText}`;
    const err = new Error(errorMessage);
    err.status = response.status;
    err.originalError = error;
    throw err;
  }
  
  // Si la respuesta no es exitosa, lanzar error
  if (!response.ok) {
    console.error('Error en la respuesta de la API:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      data
    });
    
    // Manejar 401 - No autorizado (token inválido o expirado)
    if (response.status === 401) {
      console.warn('Sesión expirada o token inválido. Redirigiendo a login...');
      // Limpiar tokens y datos de usuario
      localStorage.removeItem('tugood_token');
      localStorage.removeItem('tugood_user');
      localStorage.removeItem('token'); // Para compatibilidad con versiones anteriores
      localStorage.removeItem('user');   // Para compatibilidad con versiones anteriores
      
      // Redirigir a login solo si no estamos ya en la página de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session_expired=1';
      }
    }
    
    // Mensaje de error predeterminado
    let errorMessage = 'Error en la petición';
    
    // Mejorar mensaje según el código de estado
    switch (response.status) {
      case 400:
        errorMessage = 'Solicitud incorrecta';
        if (data.errors) {
          errorMessage += ': ' + Object.values(data.errors).join(', ');
        }
        break;
      case 401:
        errorMessage = 'No autorizado';
        // Limpiar credenciales si el token es inválido o expiró
        if (data.error === 'Token expirado' || data.error === 'Token inválido') {
          localStorage.removeItem('tugood_token');
          localStorage.removeItem('tugood_user');
          localStorage.removeItem('userId');
          // Redirigir al login en el próximo tick del event loop
          setTimeout(() => {
            if (window.location.pathname !== '/login') {
              window.location.href = '/login?session_expired=1';
            }
          }, 0);
        }
        break;
      case 403:
        errorMessage = 'No tienes permisos para realizar esta acción';
        break;
      case 404:
        errorMessage = 'Recurso no encontrado';
        break;
      case 500:
        errorMessage = 'Error interno del servidor';
        break;
      default:
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        }
    }
    
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  
  return data;
};

/**
 * Función general para hacer requests con token
 */
async function request(url, options = {}) {
  const token = localStorage.getItem('tugood_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    return await handleResponse(response);
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      // Limpiar datos de sesión
      ['tugood_token', 'tugood_user', 'userId'].forEach(key => {
        localStorage.removeItem(key);
      });
      // Redirigir al login si no estamos ya ahí
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?session_expired=1';
      }
    }
    throw error;
  }
}

// Mock data for development
const mockUsers = {
  'demo@tugood.com': {
    id: 1,
    email: 'demo@tugood.com',
    nombre: 'Usuario Demo',
    rol: 'cliente'
  }
};

const mockLogin = async (email, password) => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  
  // Accept any email/password for demo purposes
  if (email && password) {
    const user = {
      id: 1,
      email: email,
      nombre: email.split('@')[0] || 'Usuario',
      rol: 'cliente'
    };
    const token = 'mock-jwt-token-' + Date.now();
    return { user, token };
  }
  
  throw new Error('Email y contraseña requeridos');
};

// Helper para obtener headers con autenticación
const getAuthHeaders = (additionalHeaders = {}) => {
  // Obtener el token del localStorage
  let token = localStorage.getItem('tugood_token');
  
  // Si no hay token, intentar obtenerlo de otro lugar (por si acaso)
  if (!token) {
    console.warn('⚠️ No se encontró token de autenticación en localStorage');
    
    // Verificar si hay un usuario guardado que pueda contener el token
    const userData = localStorage.getItem('tugood_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.token) {
          token = user.token;
          console.log('🔑 Token encontrado en datos de usuario');
        }
      } catch (e) {
        console.error('Error al parsear datos de usuario:', e);
      }
    }
  } else {
    // Limpiar el token si tiene prefijo 'Bearer '
    if (token.startsWith('Bearer ')) {
      token = token.substring(7);
    }
    console.log('🔑 Token encontrado en localStorage, longitud:', token.length);
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...additionalHeaders
  };
};

// ============ AUTENTICACIÓN ============

export const authAPI = {
  /**
   * Registrar un nuevo usuario
   * @param {Object} userData - Datos del usuario a registrar
   * @returns {Promise<Object>} Datos del usuario registrado
   */
  register: async (userData) => {
    try {
      const data = await request('/auth/register', {
        method: 'POST',
        body: userData
      });
      
      // Si el registro incluye login automático
      if (data.token) {
        localStorage.setItem('tugood_token', data.token);
        
        if (data.user) {
          localStorage.setItem('tugood_user', JSON.stringify(data.user));
          if (data.user.id) {
            localStorage.setItem('userId', data.user.id);
          }
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error en registro:', error);
      throw new Error(error.message || 'Error al registrar el usuario');
    }
  },

  /**
   * Iniciar sesión con email y contraseña
   * @param {string} email - Correo electrónico del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<Object>} Datos del usuario y token
   */
  login: async (email, password) => {
    try {
      console.log('Iniciando sesión con:', { email });
      
      // Validar email y contraseña
      if (!email || !password) {
        throw new Error('Email y contraseña son requeridos');
      }
      
      // Realizar la petición de login
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      // Manejar la respuesta
      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Error al parsear respuesta del servidor:', e);
        throw new Error('Error en la respuesta del servidor');
      }
      
      // Si hay un error en la respuesta, lanzar excepción
      if (!response.ok) {
        console.error('Error en login:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        
        let errorMessage = 'Error al iniciar sesión';
        if (response.status === 401) {
          errorMessage = 'Credenciales inválidas. Verifica tu email y contraseña.';
        } else if (data && data.error) {
          errorMessage = data.error;
        } else if (data && data.message) {
          errorMessage = data.message;
        }
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      // Verificar que se recibió un token
      if (!data.token) {
        console.error('No se recibió token en la respuesta:', data);
        throw new Error('No se recibió token de autenticación');
      }
      
      console.log('Login exitoso, token recibido, longitud:', data.token.length);
      
      // Guardar token y datos del usuario en localStorage
      localStorage.setItem('tugood_token', data.token);
      
      // Asegurarse de que data.user existe
      if (!data.user) {
        data.user = {
          id: data.userId || data.id,
          email: data.email || email,
          nombre: data.nombre || 'Usuario',
          rol: data.rol || 'cliente'
        };
      }
      
      // Guardar datos del usuario
      localStorage.setItem('tugood_user', JSON.stringify(data.user));
      if (data.user.id) {
        localStorage.setItem('userId', data.user.id);
      }
      
      console.log('Datos de usuario guardados:', data.user);
      
      return data;
      
    } catch (error) {
      console.error('Error en login:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      
      // Limpiar credenciales en caso de error
      if (error.status === 401) {
        localStorage.removeItem('tugood_token');
        localStorage.removeItem('tugood_user');
        localStorage.removeItem('userId');
      }
      
      throw error;
    }
  },

  // Login con Google
  googleLogin: async (googleToken) => {
    try {
      const data = await request('/auth/google', {
        method: 'POST',
        body: { token: googleToken }
      });
      
      if (data.token && data.user) {
        localStorage.setItem('tugood_token', data.token);
        localStorage.setItem('tugood_user', JSON.stringify(data.user));
        if (data.user.id) {
          localStorage.setItem('userId', data.user.id);
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error en login con Google:', error);
      throw new Error(error.message || 'Error al iniciar sesión con Google');
    }
  },

  // Obtener perfil del usuario autenticado
  getProfile: async () => {
    try {
      return await request('/users/profile');
    } catch (error) {
      console.error('Error al obtener perfil:', {
        message: error.message,
        status: error.status,
        details: error.data?.details || 'Sin detalles adicionales'
      });
      // Limpiar credenciales si hay un error de autenticación
      if (error.status === 401 || error.status === 403) {
        localStorage.removeItem('tugood_token');
        localStorage.removeItem('tugood_user');
        localStorage.removeItem('tugood_location');
        window.location.href = '/login';
      }
      throw error;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('tugood_token');
    localStorage.removeItem('tugood_user');
    localStorage.removeItem('tugood_location');
  },

  // Verificar si está autenticado
  isAuthenticated: () => {
    // Verificar ambos nombres de token para compatibilidad
    return !!(localStorage.getItem('tugood_token') || localStorage.getItem('token'));
  },
  
  // Obtener usuario actual
  getCurrentUser: () => {
    // Intentar con el nuevo formato primero, luego con el antiguo
    const user = localStorage.getItem('tugood_user') || localStorage.getItem('user');
    try {
      return user ? JSON.parse(user) : null;
    } catch (e) {
      console.error('Error al parsear datos de usuario:', e);
      return null;
    }
  },
  
  // Obtener el token de autenticación
  getToken: () => {
    return localStorage.getItem('tugood_token') || localStorage.getItem('token');
  }
};

// ============ COMERCIOS ============

export const comerciosAPI = {
  // Obtener lista de comercios con filtros
  getList: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.zona) params.append('zona', filters.zona);
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.busqueda) params.append('busqueda', filters.busqueda);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    
    const response = await fetch(`${API_BASE_URL}/comercios?${params}`);
    return handleResponse(response);
  },

  // Obtener comercio específico
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/comercios/${id}`);
    return handleResponse(response);
  },

  // Obtener zonas de Bogotá disponibles
  getZonas: async () => {
    const response = await fetch(`${API_BASE_URL}/comercios/zonas/list`);
    return handleResponse(response);
  },

  // Obtener perfil del comercio (solo para comercios autenticados)
  getMyProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/comercios/me/profile`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Actualizar comercio (solo dueño)
  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/comercios/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  }
};

// ============ PACKS ============

export const packsAPI = {
  // Obtener lista de packs con filtros
  getList: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.zona) params.append('zona', filters.zona);
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.precio_max) params.append('precio_max', filters.precio_max);
    if (filters.busqueda) params.append('busqueda', filters.busqueda);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    
    const response = await fetch(`${API_BASE_URL}/packs?${params}`);
    return handleResponse(response);
  },

  // Obtener pack específico
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/packs/${id}`);
    return handleResponse(response);
  },

  // Crear pack (solo comercios)
  create: async (packData) => {
    const response = await fetch(`${API_BASE_URL}/packs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(packData)
    });
    return handleResponse(response);
  },

  // Actualizar pack (solo dueño)
  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/packs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // Eliminar pack (solo dueño)
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/packs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Obtener packs del comercio autenticado
  getMyPacks: async () => {
    const response = await fetch(`${API_BASE_URL}/packs/me/list`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// ============ PEDIDOS ============

export const pedidosAPI = {
  // Obtener pedidos del usuario autenticado
  getList: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    
    try {
      return await request(`/pedidos?${params.toString()}`);
    } catch (error) {
      // Si no hay pedidos, devolver array vacío en lugar de error
      if (error.status === 404) return [];
      throw error;
    }
  },

  // Obtener pedidos por ID de usuario
  getByUser: async (userId) => {
    if (!userId) throw new Error('No se proporcionó el ID de usuario');
    
    try {
      const response = await request(`/pedidos/usuario/${userId}`);
      // Manejar tanto el formato antiguo (array) como el nuevo (objeto con orders)
      if (response && Array.isArray(response.orders)) {
        return response.orders; // Nuevo formato: { total: number, orders: [] }
      } else if (Array.isArray(response)) {
        return response; // Formato antiguo: array directo
      }
      return [];
    } catch (error) {
      console.error('Error al obtener pedidos:', error);
      // En caso de error, devolver array vacío
      return [];
    }
  },

  // Obtener pedido específico
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/pedidos/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Crear nuevo pedido
  create: async (pedidoData) => {
    const response = await fetch(`${API_BASE_URL}/pedidos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(pedidoData)
    });
    return handleResponse(response);
  },

  // Cancelar pedido
  cancel: async (id) => {
    const response = await fetch(`${API_BASE_URL}/pedidos/${id}/cancelar`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Obtener pedidos del comercio (solo comercios)
  getComercioOrders: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.fecha) params.append('fecha', filters.fecha);
    
    const response = await fetch(`${API_BASE_URL}/pedidos/comercio/list?${params}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Actualizar estado del pedido (solo comercios)
  updateStatus: async (id, estado) => {
    const response = await fetch(`${API_BASE_URL}/pedidos/${id}/estado`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ estado })
    });
    return handleResponse(response);
  }
};

// ============ PAGOS ============

export const pagosAPI = {
  // Procesar pago
  process: async (paymentData) => {
    const response = await fetch(`${API_BASE_URL}/pagos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentData)
    });
    return handleResponse(response);
  },

  // Obtener pago de un pedido
  getByOrder: async (pedidoId) => {
    const response = await fetch(`${API_BASE_URL}/pagos/pedido/${pedidoId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Obtener historial de pagos
  getHistory: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.metodo) params.append('metodo', filters.metodo);
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    
    const response = await fetch(`${API_BASE_URL}/pagos/historial?${params}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Obtener métodos de pago disponibles
  getPaymentMethods: async () => {
    return await request('/pagos/metodos');
  }
};

// ============ USUARIOS ============

export const usersAPI = {
  // Obtener perfil completo
  getProfile: async () => {
    return await request('/users/profile');
  },

  // Actualizar perfil
  updateProfile: async (userData) => {
    return await request('/users/profile', {
      method: 'PUT',
      body: userData
    });
  },

  // Actualizar configuraciones
  updateSettings: async (settings) => {
    return await request('/users/configuraciones', {
      method: 'PUT',
      body: settings
    });
  },

  // Obtener favoritos
  getFavorites: async () => {
    return await request('/users/favoritos');
  },

  // Obtener notificaciones
  getNotifications: async () => {
    return await request('/users/notificaciones');
  }
};

// ============ UTILIDADES ============

export const utils = {
  // Formatear precio en pesos colombianos
  formatPrice: (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  },

  // Formatear fecha
  formatDate: (date) => {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  },

  // Calcular distancia entre coordenadas
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distancia en km
  }
};

export default {
  auth: authAPI,
  comercios: comerciosAPI,
  packs: packsAPI,
  pedidos: pedidosAPI,
  pagos: pagosAPI,
  users: usersAPI,
  utils
};
