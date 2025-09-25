import React, { useState } from 'react';
import { MapPin, Navigation, List } from 'lucide-react';

const MapView = ({ businesses, city }) => {
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  // Mock map implementation (in a real app, you'd use Google Maps or similar)
  const handleBusinessClick = (business) => {
    setSelectedBusiness(business);
  };

  return (
    <div className="map-view">
      <div className="map-container">
        <div className="map-placeholder">
          <div className="map-info">
            <MapPin size={48} />
            <h3>Vista de Mapa</h3>
            <p>Mostrando {businesses.length} comercios en {city.name}</p>
            <div className="map-note">
              <small>En una implementación real, aquí se mostraría un mapa interactivo con Google Maps</small>
            </div>
          </div>
          
          {/* Mock map pins */}
          <div className="map-pins">
            {businesses.map((business, index) => (
              <div
                key={business.id}
                className={`map-pin ${selectedBusiness?.id === business.id ? 'selected' : ''}`}
                style={{
                  left: `${20 + (index * 15)}%`,
                  top: `${30 + (index * 10)}%`
                }}
                onClick={() => handleBusinessClick(business)}
              >
                <div className="pin-icon">
                  <MapPin size={20} />
                </div>
                <div className="pin-label">
                  {business.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Business info overlay */}
      {selectedBusiness && (
        <div className="business-overlay">
          <div className="business-quick-info">
            <img src={selectedBusiness.image} alt={selectedBusiness.name} />
            <div className="quick-info-content">
              <h4>{selectedBusiness.name}</h4>
              <p>{selectedBusiness.description}</p>
              <div className="quick-price">
                <span className="original-price">{selectedBusiness.originalPrice}€</span>
                <span className="discount-price">{selectedBusiness.discountPrice}€</span>
              </div>
              <button className="btn btn-primary quick-reserve-btn">
                Reservar ahora
              </button>
            </div>
            <button 
              className="close-overlay-btn"
              onClick={() => setSelectedBusiness(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Map controls */}
      <div className="map-controls">
        <button className="map-control-btn">
          <Navigation size={20} />
        </button>
      </div>
    </div>
  );
};

export default MapView;
