import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, LogOut, CheckCircle, RefreshCw } from 'lucide-react';
import useGeolocation from '../hooks/useGeolocation';
import PropTypes from 'prop-types';
import logger from '../utils/logger';
import '../styles/LocationScreen.css';

const LocationScreen = ({ user, onLocationSelect, onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const { loading: geoLoading, getCurrentPosition, findClosestZone } = useGeolocation();

  const bogotaZones = [
    { id: 1, name: 'Chapinero', country: 'Bogotá', coords: { lat: 4.6351, lng: -74.0669 } },
    { id: 2, name: 'Usaquén', country: 'Bogotá', coords: { lat: 4.7110, lng: -74.0721 } },
    { id: 3, name: 'Teusaquillo', country: 'Bogotá', coords: { lat: 4.6392, lng: -74.0969 } },
    { id: 4, name: 'Kennedy', country: 'Bogotá', coords: { lat: 4.6280, lng: -74.1372 } },
    { id: 5, name: 'Zona Rosa', country: 'Bogotá', coords: { lat: 4.6486, lng: -74.0648 } },
    { id: 6, name: 'La Candelaria', country: 'Bogotá', coords: { lat: 4.5981, lng: -74.0758 } },
    { id: 7, name: 'Suba', country: 'Bogotá', coords: { lat: 4.7569, lng: -74.0776 } },
    { id: 8, name: 'Engativá', country: 'Bogotá', coords: { lat: 4.7110, lng: -74.1469 } }
  ];

  const [filteredCities, setFilteredCities] = useState(bogotaZones);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = bogotaZones.filter(city =>
        city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities(bogotaZones);
    }
  }, [searchTerm]);

  const handleCitySelect = (city) => {
    setSelectedCity(city);
  };

  const navigate = useNavigate();

  const handleConfirmLocation = () => {
    if (selectedCity && !loading) {
      logger.location('Confirmando ubicación', selectedCity);
      setLoading(true);
      
      // Verificar que onLocationSelect existe
      if (typeof onLocationSelect === 'function') {
        // Mostrar mensaje de confirmación
        setShowConfirmation(true);
        
        // Llamar a onLocationSelect inmediatamente para actualizar el estado
        onLocationSelect(selectedCity);
        
        // Esperar un momento para mostrar el mensaje, luego navegar
        setTimeout(() => {
          logger.location('Navegando a MainScreen');
          navigate('/main');
          setLoading(false);
          setShowConfirmation(false);
        }, 1500);
      } else {
        logger.error('onLocationSelect no es una función', onLocationSelect);
        setLoading(false);
        alert('Error: No se puede procesar la ubicación seleccionada.');
      }
    } else if (!selectedCity) {
      alert('Por favor selecciona una zona antes de continuar.');
    }
  };

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    
    try {
      logger.location('🔄 Solicitando ubicación GPS actual...');
      
      // Obtener ubicación rápida con configuración optimizada
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Tu navegador no soporta geolocalización'));
          return;
        }

        // Primero intentar con configuración rápida
        navigator.geolocation.getCurrentPosition(
          (position) => {
            logger.location('📍 Ubicación GPS obtenida:', {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
            resolve(position);
          },
          (error) => {
            // Si falla, intentar con configuración menos precisa pero más rápida
            navigator.geolocation.getCurrentPosition(
              (position) => {
                logger.location('📍 Ubicación obtenida (modo rápido):', {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  accuracy: position.coords.accuracy
                });
                resolve(position);
              },
              (fallbackError) => {
                let errorMessage = 'No se pudo obtener tu ubicación GPS. ';
                switch(fallbackError.code) {
                  case 1: // PERMISSION_DENIED
                    errorMessage += 'Permisos denegados. Habilita la ubicación en tu navegador.';
                    break;
                  case 2: // POSITION_UNAVAILABLE
                    errorMessage += 'Ubicación no disponible.';
                    break;
                  case 3: // TIMEOUT
                    errorMessage += 'Tiempo de espera agotado.';
                    break;
                  default:
                    errorMessage += 'Error desconocido.';
                    break;
                }
                reject(new Error(errorMessage));
              },
              {
                enableHighAccuracy: false, // Modo rápido
                timeout: 5000,            // 5 segundos
                maximumAge: 300000        // Usar cache de 5 minutos
              }
            );
          },
          {
            enableHighAccuracy: true,  // Intentar alta precisión primero
            timeout: 8000,            // 8 segundos máximo
            maximumAge: 60000         // Cache de 1 minuto
          }
        );
      });

      const { latitude, longitude } = position.coords;
      
      // Obtener dirección usando geocodificación inversa (optimizada)
      let address = 'Dirección no disponible';
      
      // Hacer la geocodificación en paralelo, no bloquear la UI
      const geocodePromise = (async () => {
        try {
          logger.location('🔍 Obteniendo dirección...');
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos timeout
          
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&language=es&region=CO&result_type=street_address|route`,
            { signal: controller.signal }
          );
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              const result = data.results[0];
              address = result.formatted_address
                .replace(', Colombia', '')
                .replace(', Bogotá', '');
              logger.location('📍 Dirección obtenida:', address);
              return address;
            }
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            logger.warn('Error obteniendo dirección:', error.message);
          }
        }
        return 'Dirección no disponible';
      })();
      
      // Encontrar la zona más cercana inmediatamente
      const closestZone = findClosestZone(bogotaZones, latitude, longitude);
      
      if (closestZone) {
        // Crear el objeto de ubicación inmediatamente
        const currentLocationCity = {
          id: 'current',
          name: `${closestZone.name} (Tu ubicación GPS)`,
          country: 'Bogotá',
          coords: { 
            lat: latitude, 
            lng: longitude 
          },
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
          address: 'Obteniendo dirección...' // Placeholder mientras se obtiene
        };
        
        logger.location('✅ Ubicación GPS configurada:', currentLocationCity);
        setSelectedCity(currentLocationCity);
        
        // Mostrar confirmación inmediata
        const precisionText = position.coords.accuracy <= 20 ? 
          `🎯 Precisión: ${Math.round(position.coords.accuracy)}m (Excelente)` :
          position.coords.accuracy <= 50 ?
          `🎯 Precisión: ${Math.round(position.coords.accuracy)}m (Buena)` :
          `🎯 Precisión: ${Math.round(position.coords.accuracy)}m (Aproximada)`;
          
        alert(`📍 Ubicación GPS obtenida exitosamente!\n\n📍 Zona: ${closestZone.name}\n${precisionText}\n🏠 Obteniendo dirección...`);
        
        // Actualizar con la dirección cuando esté lista (no bloquear)
        geocodePromise.then(finalAddress => {
          if (finalAddress !== 'Dirección no disponible') {
            setSelectedCity(prev => ({
              ...prev,
              address: finalAddress
            }));
          } else {
            setSelectedCity(prev => ({
              ...prev,
              address: 'Dirección no disponible'
            }));
          }
        });
      }
    } catch (error) {
      logger.error('❌ Error obteniendo ubicación GPS:', error.message);
      
      // Fallback to Chapinero if geolocation fails
      const fallbackCity = {
        id: 'fallback',
        name: 'Chapinero (Zona por defecto)',
        country: 'Bogotá',
        coords: { lat: 4.6351, lng: -74.0669 }
      };
      setSelectedCity(fallbackCity);
      alert(error.message + '\n\nSe seleccionó Chapinero como zona por defecto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="location-screen">
      <div className="container">
        <div className="location-header">
          <button className="back-btn" onClick={onLogout}>
            <LogOut size={24} />
          </button>
          <div className="user-info">
            <span>Hola, {user?.name || 'Usuario'}</span>
          </div>
        </div>

        <div className="location-content">
          <div className="location-title">
            <h1>¿Dónde estás?</h1>
            <p>Selecciona tu ciudad para encontrar ofertas cercanas</p>
          </div>

          <div className="location-actions">
            <button 
              className="btn btn-primary current-location-btn"
              onClick={handleUseCurrentLocation}
              disabled={loading || geoLoading}
            >
              <Navigation size={20} />
              {(loading || geoLoading) ? 'Obteniendo ubicación GPS...' : 'Usar mi ubicación actual'}
            </button>
          </div>

          <div className="location-actions">
            <button 
              className="btn btn-secondary refresh-location-btn"
              onClick={handleUseCurrentLocation}
              disabled={loading || geoLoading}
              title="Obtener ubicación GPS fresca"
            >
              <RefreshCw size={20} />
              {(loading || geoLoading) ? 'Actualizando GPS...' : 'Actualizar ubicación GPS'}
            </button>
          </div>

          <div className="search-section">
            <div className="search-input-container">
              <MapPin className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Buscar zona..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input search-input"
              />
            </div>
          </div>

          <div className="cities-section">
            <h3>Zonas de Bogotá</h3>
            <div className="cities-grid">
              {filteredCities.map((city) => (
                <button
                  key={city.id}
                  className={`city-card ${selectedCity?.id === city.id ? 'selected' : ''}`}
                  onClick={() => handleCitySelect(city)}
                >
                  <MapPin size={20} className="city-icon" />
                  <div className="city-info">
                    <span className="city-name">{city.name}</span>
                    <span className="city-country">{city.country}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedCity && (
            <div className="selected-location">
              <div className="selected-info">
                <MapPin size={20} />
                <div>
                  <strong>{selectedCity.name}</strong>
                  <span>{selectedCity.country}</span>
                  {selectedCity.address && (
                    <span className={`selected-address ${selectedCity.address === 'Obteniendo dirección...' ? 'loading' : ''}`}>
                      📍 {selectedCity.address}
                    </span>
                  )}
                </div>
              </div>
              <button 
                className="btn btn-primary confirm-btn"
                onClick={handleConfirmLocation}
                disabled={loading}
              >
                {loading ? 'Confirmando...' : 'Confirmar ubicación'}
              </button>
            </div>
          )}

          {/* Confirmation Message */}
          {showConfirmation && (
            <div className="confirmation-message">
              <div className="confirmation-content">
                <CheckCircle size={32} className="confirmation-icon" />
                <h3>¡Ubicación confirmada!</h3>
                <p>{selectedCity?.name}</p>
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// PropTypes validation
LocationScreen.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  onLocationSelect: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired
};

export default LocationScreen;
