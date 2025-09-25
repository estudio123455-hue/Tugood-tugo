import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Zap } from 'lucide-react';

const InteractiveMap = ({ comercios = [], selectedComercio, onComercioSelect, userLocation }) => {
  const [mapCenter, setMapCenter] = useState({ lat: 4.6097, lng: -74.0817 }); // Bogotá
  const [zoom, setZoom] = useState(13);

  // Actualizar centro del mapa basado en la ubicación del usuario
  useEffect(() => {
    if (userLocation && userLocation.coords) {
      setMapCenter({
        lat: userLocation.coords.lat,
        lng: userLocation.coords.lng
      });
      setZoom(15);
    }
  }, [userLocation]);

  // Función para calcular distancia aproximada
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  // Función para obtener color por tipo de comercio
  const getComercioColor = (tipo) => {
    const colors = {
      'Panadería': '#ff6b35',
      'Comida Casera': '#4caf50',
      'Pizza': '#f44336',
      'Cafetería': '#795548',
      'default': '#9e9e9e'
    };
    return colors[tipo] || colors.default;
  };

  return (
    <div className="interactive-map">
      {/* Header del mapa */}
      <div className="map-header">
        <div className="map-title">
          <MapPin size={20} className="text-primary-600" />
          <h3>Comercios cerca de ti</h3>
        </div>
        <div className="map-stats">
          <span className="comercios-count">{comercios.length} comercios</span>
          {userLocation && (
            <span className="user-location">
              <Navigation size={14} />
              Tu ubicación
            </span>
          )}
        </div>
      </div>

      {/* Mapa visual con comercios */}
      <div className="map-container">
        <div className="map-background">
          {/* Simulación de mapa con grid */}
          <div className="map-grid">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="grid-line" />
            ))}
          </div>
          
          {/* Ubicación del usuario */}
          {userLocation && (
            <div 
              className="user-marker"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="user-marker-pulse" />
              <Navigation size={16} className="user-icon" />
            </div>
          )}

          {/* Marcadores de comercios */}
          {comercios.map((comercio, index) => {
            const distance = userLocation 
              ? calculateDistance(
                  userLocation.coords.lat, 
                  userLocation.coords.lng,
                  comercio.coords?.lat || 4.6097,
                  comercio.coords?.lng || -74.0817
                )
              : '0.5';

            // Posición relativa basada en el índice (simulada)
            const positions = [
              { left: '30%', top: '25%' },
              { left: '70%', top: '35%' },
              { left: '45%', top: '70%' },
              { left: '25%', top: '60%' },
              { left: '80%', top: '20%' }
            ];
            const position = positions[index % positions.length];

            return (
              <div
                key={comercio.id}
                className={`comercio-marker ${selectedComercio?.id === comercio.id ? 'selected' : ''}`}
                style={{
                  left: position.left,
                  top: position.top,
                  '--marker-color': getComercioColor(comercio.type)
                }}
                onClick={() => onComercioSelect && onComercioSelect(comercio)}
              >
                <div className="marker-pin">
                  <MapPin size={20} />
                </div>
                <div className="marker-info">
                  <div className="marker-name">{comercio.name}</div>
                  <div className="marker-distance">{distance} km</div>
                  <div className="marker-type">{comercio.type}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de comercios debajo del mapa */}
      <div className="comercios-list">
        <h4>Comercios disponibles</h4>
        <div className="comercios-grid">
          {comercios.map((comercio) => {
            const distance = userLocation 
              ? calculateDistance(
                  userLocation.coords.lat, 
                  userLocation.coords.lng,
                  comercio.coords?.lat || 4.6097,
                  comercio.coords?.lng || -74.0817
                )
              : '0.5';

            return (
              <div
                key={comercio.id}
                className={`comercio-card ${selectedComercio?.id === comercio.id ? 'selected' : ''}`}
                onClick={() => onComercioSelect && onComercioSelect(comercio)}
              >
                <div className="comercio-header">
                  <div 
                    className="comercio-marker-mini"
                    style={{ backgroundColor: getComercioColor(comercio.type) }}
                  >
                    <MapPin size={12} />
                  </div>
                  <div className="comercio-info">
                    <h5>{comercio.name}</h5>
                    <span className="comercio-type">{comercio.type}</span>
                  </div>
                  <div className="comercio-distance">
                    <Zap size={12} />
                    {distance} km
                  </div>
                </div>
                <div className="comercio-details">
                  <span className="comercio-address">{comercio.direccion || 'Bogotá, Colombia'}</span>
                  <span className="comercio-items">{comercio.itemsAvailable} disponibles</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;
