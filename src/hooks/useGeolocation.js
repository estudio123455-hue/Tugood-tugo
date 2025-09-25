import { useState, useCallback, useEffect } from 'react';
import logger from '../utils/logger';
import { hasSignificantMovement } from '../utils/geoUtils';

const useGeolocation = (options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [position, setPosition] = useState(null);
  const [lastPosition, setLastPosition] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt');

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000, // Reducir timeout a 10 segundos
    maximumAge: 60000, // Reducir cache a 1 minuto
    ...options
  };

  // Verificar permisos de geolocalización al montar el componente
  useEffect(() => {
    const checkPermissions = async () => {
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          setPermissionStatus(permission.state);
          
          // Escuchar cambios en los permisos
          permission.addEventListener('change', () => {
            setPermissionStatus(permission.state);
            logger.location('Permiso de geolocalización cambió a:', permission.state);
          });
        } catch (error) {
          logger.error('Error checking geolocation permissions:', error);
        }
      }
    };

    checkPermissions();
  }, []);

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error('Geolocation is not supported by this browser');
        error.code = 'NOT_SUPPORTED';
        reject(error);
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // Check if movement is significant before updating
          if (hasSignificantMovement(currentCoords, lastPosition?.coords, 200)) {
            logger.location('Ubicación obtenida - movimiento significativo', currentCoords);
            setPosition(position);
            setLastPosition(position);
          } else {
            logger.debug('Movimiento menor a 200m, no actualizando ubicación');
          }
          
          setLoading(false);
          resolve(position);
        },
        (error) => {
          logger.error('Error getting location', error);
          
          let errorMessage = 'No se pudo obtener tu ubicación. ';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Permiso denegado. Por favor, permite el acceso a la ubicación.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Ubicación no disponible.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Tiempo de espera agotado.';
              break;
            default:
              errorMessage += 'Error desconocido.';
              break;
          }
          
          const enhancedError = new Error(errorMessage);
          enhancedError.code = error.code;
          enhancedError.originalError = error;
          
          setError(enhancedError);
          setLoading(false);
          reject(enhancedError);
        },
        defaultOptions
      );
    });
  }, [defaultOptions]);

  const findClosestZone = useCallback((zones, latitude, longitude) => {
    if (!zones || zones.length === 0) return null;
    
    let closestZone = zones[0];
    let minDistance = Infinity;
    
    zones.forEach(zone => {
      const distance = Math.sqrt(
        Math.pow(zone.coords.lat - latitude, 2) + 
        Math.pow(zone.coords.lng - longitude, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestZone = zone;
      }
    });
    
    logger.location('Zona más cercana encontrada', closestZone);
    return closestZone;
  }, []);

  // Función para solicitar permisos de ubicación de manera más amigable
  const requestLocationPermission = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Intentar obtener la ubicación para activar el prompt de permisos
      const position = await getCurrentPosition();
      return position;
    } catch (error) {
      // Si el error es por permisos denegados, mostrar mensaje específico
      if (error.code === 1) { // PERMISSION_DENIED
        setError(new Error('Para una mejor experiencia, permite el acceso a tu ubicación en la configuración del navegador.'));
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getCurrentPosition]);

  // Función para obtener ubicación con reintentos
  const getLocationWithRetry = useCallback(async (maxRetries = 2) => {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const position = await getCurrentPosition();
        return position;
      } catch (error) {
        lastError = error;
        logger.warn(`Intento ${i + 1} de obtener ubicación falló:`, error.message);
        
        // Si es error de permisos, no reintentar
        if (error.code === 1) break;
        
        // Esperar un poco antes del siguiente intento
        if (i < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    throw lastError;
  }, [getCurrentPosition]);

  return {
    loading,
    error,
    position,
    permissionStatus,
    getCurrentPosition,
    requestLocationPermission,
    getLocationWithRetry,
    findClosestZone
  };
};

export default useGeolocation;
