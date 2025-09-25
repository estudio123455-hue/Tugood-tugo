// Simple logger utility for development
const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  debug: (message, data = null) => {
    if (isDevelopment) {
      console.log(`🔍 [DEBUG] ${message}`, data || '');
    }
  },
  
  info: (message, data = null) => {
    if (isDevelopment) {
      console.log(`ℹ️ [INFO] ${message}`, data || '');
    }
  },
  
  warn: (message, data = null) => {
    console.warn(`⚠️ [WARN] ${message}`, data || '');
  },
  
  error: (message, error = null) => {
    console.error(`❌ [ERROR] ${message}`, error || '');
  },
  
  location: (message, data = null) => {
    if (isDevelopment) {
      console.log(`📍 [LOCATION] ${message}`, data || '');
    }
  }
};

export default logger;
