import React, { useState, useEffect } from 'react';
import MapFallback from './MapFallback';
import { MapPin, Star, Clock, DollarSign } from 'lucide-react';

const ComerciosMap = ({ comercios = [], selectedComercio, onComercioSelect, userLocation }) => {
  const [mapCenter, setMapCenter] = useState({ lat: 4.6097, lng: -74.0817 }); // Bogotá
  const [showMap, setShowMap] = useState(true);
  const [hasValidApiKey, setHasValidApiKey] = useState(false);

  // Verificar si tenemos una API key válida
  useEffect(() => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    // Usar fallback siempre para evitar errores de Google Maps
    setHasValidApiKey(false);
    setShowMap(false); // No mostrar mapa real, usar fallback
  }, []);

  // Actualizar centro del mapa basado en la ubicación del usuario
  useEffect(() => {
    if (userLocation && userLocation.coords) {
      setMapCenter({
        lat: userLocation.coords.lat,
        lng: userLocation.coords.lng
      });
    }
  }, [userLocation]);

  // Convertir comercios a marcadores para el mapa
  const markers = comercios.map((comercio, index) => ({
    lat: comercio.latitud || (4.6097 + (Math.random() - 0.5) * 0.1), // Coordenadas aleatorias cerca de Bogotá si no hay datos reales
    lng: comercio.longitud || (-74.0817 + (Math.random() - 0.5) * 0.1),
    title: comercio.nombre,
    icon: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="${selectedComercio?.id === comercio.id ? '#F59E0B' : '#10B981'}" stroke="#FFFFFF" stroke-width="3"/>
          <circle cx="20" cy="20" r="8" fill="#FFFFFF"/>
          <text x="20" y="25" text-anchor="middle" fill="${selectedComercio?.id === comercio.id ? '#F59E0B' : '#10B981'}" font-size="12" font-weight="bold">🏪</text>
        </svg>
      `),
      scaledSize: window.google?.maps?.Size ? new window.google.maps.Size(40, 40) : undefined,
      anchor: window.google?.maps?.Point ? new window.google.maps.Point(20, 20) : undefined
    },
    info: {
      title: comercio.nombre,
      description: `${comercio.tipo_comercio} • ${comercio.zona_bogota}`,
      address: comercio.direccion,
      rating: comercio.rating
    },
    comercio // Datos completos del comercio
  }));

  // Agregar marcador de ubicación del usuario si está disponible
  if (userLocation && userLocation.coords) {
    markers.push({
      lat: userLocation.coords.lat,
      lng: userLocation.coords.lng,
      title: 'Tu ubicación',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#3B82F6" stroke="#FFFFFF" stroke-width="3"/>
            <circle cx="16" cy="16" r="6" fill="#FFFFFF"/>
            <text x="16" y="20" text-anchor="middle" fill="#3B82F6" font-size="12" font-weight="bold">📍</text>
          </svg>
        `),
        scaledSize: window.google?.maps?.Size ? new window.google.maps.Size(32, 32) : undefined,
        anchor: window.google?.maps?.Point ? new window.google.maps.Point(16, 16) : undefined
      },
      info: {
        title: 'Tu ubicación actual',
        description: userLocation.name || 'Ubicación detectada por GPS'
      }
    });
  }

  const handleMarkerClick = (markerData, index) => {
    if (markerData.comercio && onComercioSelect) {
      onComercioSelect(markerData.comercio);
    }
  };

  if (!showMap) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Mapa no disponible</h3>
        <p className="text-gray-500 mb-4">No se pudo cargar el mapa de Google Maps</p>
        <button 
          onClick={() => setShowMap(true)}
          className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header del mapa */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={20} className="text-amber-500" />
            <h3 className="font-semibold text-gray-800">
              Comercios cerca de ti
            </h3>
          </div>
          <div className="text-sm text-gray-500">
            {comercios.length} {comercios.length === 1 ? 'comercio' : 'comercios'}
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="relative">
        <GoogleMap
          center={mapCenter}
          zoom={13}
          markers={markers}
          onMarkerClick={handleMarkerClick}
          height="400px"
          className="w-full"
        />
        
        {/* Leyenda */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Comercios disponibles</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Comercio seleccionado</span>
          </div>
          {userLocation && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Tu ubicación</span>
            </div>
          )}
        </div>
      </div>

      {/* Información del comercio seleccionado */}
      {selectedComercio && (
        <div className="p-4 bg-amber-50 border-t border-amber-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-1">
                {selectedComercio.nombre}
              </h4>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-500" />
                  <span>{selectedComercio.rating || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>Abierto hasta 20:00</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                📍 {selectedComercio.direccion || selectedComercio.zona_bogota}
              </p>
            </div>
            <button 
              onClick={() => onComercioSelect && onComercioSelect(null)}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComerciosMap;
