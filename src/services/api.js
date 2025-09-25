// API Service para TuGood TuGo - Versión con Mock API Fallback
import { mockApiService } from './mockApi';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
let USE_MOCK_API = true; // Activar mock API por defecto para producción

/**
 * Realiza petición con fallback a mock API
 */
const apiRequest = async (endpoint, options = {}) => {
  if (USE_MOCK_API) {
    return await handleMockRequest(endpoint, options);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options
  };
  
  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`API Error (${endpoint}), usando mock:`, error);
    USE_MOCK_API = true;
    return await handleMockRequest(endpoint, options);
  }
};

/**
 * Maneja peticiones mock
 */
const handleMockRequest = async (endpoint, options = {}) => {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : {};

  if (endpoint === '/auth/register' && method === 'POST') {
    return await mockApiService.register(body);
  }
  if (endpoint === '/auth/login' && method === 'POST') {
    return await mockApiService.login(body);
  }
  if (endpoint === '/auth/profile' && method === 'GET') {
    return await mockApiService.getProfile();
  }
  if (endpoint === '/comercios' && method === 'GET') {
    return await mockApiService.getComercios();
  }
  if (endpoint.startsWith('/comercios/') && method === 'GET') {
    const id = endpoint.split('/')[2];
    return await mockApiService.getComercio(id);
  }
  if (endpoint === '/packs' && method === 'GET') {
    return await mockApiService.getPacks();
  }
  if (endpoint.startsWith('/packs/') && method === 'GET') {
    const id = endpoint.split('/')[2];
    return await mockApiService.getPackById(id);
  }
  if (endpoint === '/pedidos' && method === 'GET') {
    return await mockApiService.getPedidos();
  }
  if (endpoint === '/pedidos' && method === 'POST') {
    return await mockApiService.createPedido(body);
  }

  return { success: true, message: 'Mock API', data: {} };
};

// Auth API
export const authAPI = {
  async register(userData) {
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async login(credentials) {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (response.success && response.token) {
      localStorage.setItem('tugood_token', response.token);
      localStorage.setItem('tugood_user', JSON.stringify(response.user));
    }
    
    return response;
  },

  async getProfile() {
    return await apiRequest('/auth/profile');
  },

  getCurrentUser() {
    try {
      const user = localStorage.getItem('tugood_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('tugood_token');
  },

  isAuthenticated() {
    const token = this.getToken();
    const user = this.getCurrentUser();
    console.log('Verificando autenticación - Token:', !!token, 'User:', !!user);
    return !!(token && user);
  },

  logout() {
    localStorage.removeItem('tugood_token');
    localStorage.removeItem('tugood_user');
  }
};

// Comercios API
export const comerciosAPI = {
  async getAll(filtros = {}) {
    const params = new URLSearchParams(filtros).toString();
    const endpoint = params ? `/comercios?${params}` : '/comercios';
    return await apiRequest(endpoint);
  },

  async getById(id) {
    return await apiRequest(`/comercios/${id}`);
  }
};

// Packs API
export const packsAPI = {
  async getAll(comercioId = null) {
    const endpoint = comercioId ? `/packs?comercio_id=${comercioId}` : '/packs';
    return await apiRequest(endpoint);
  },

  async getById(id) {
    return await apiRequest(`/packs/${id}`);
  }
};

// Pedidos API
export const pedidosAPI = {
  async getAll() {
    return await apiRequest('/pedidos');
  },

  async create(pedidoData) {
    return await apiRequest('/pedidos', {
      method: 'POST',
      body: JSON.stringify(pedidoData)
    });
  },

  async getById(id) {
    return await apiRequest(`/pedidos/${id}`);
  },

  async update(id, data) {
    return await apiRequest(`/pedidos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};

// Pagos API
export const pagosAPI = {
  async getPaymentMethods() {
    return {
      success: true,
      metodos: [
        { id: 'efectivo', nombre: 'Efectivo', icono: 'cash' },
        { id: 'tarjeta', nombre: 'Tarjeta', icono: 'card' },
        { id: 'nequi', nombre: 'Nequi', icono: 'mobile' }
      ]
    };
  },

  async process(paymentData) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      message: 'Pago procesado exitosamente',
      transactionId: 'tx_' + Date.now()
    };
  }
};

// Users API
export const usersAPI = {
  async getProfile() {
    return await mockApiService.getProfile();
  },

  async updateProfile(userData) {
    return await mockApiService.updateProfile(userData);
  },

  async getStats() {
    return {
      success: true,
      stats: {
        pedidos_realizados: 12,
        dinero_ahorrado: 85000,
        comida_rescatada: 8.5,
        co2_evitado: 12.3
      }
    };
  }
};

// Export default para compatibilidad
export default {
  authAPI,
  comerciosAPI,
  packsAPI,
  pedidosAPI
};
