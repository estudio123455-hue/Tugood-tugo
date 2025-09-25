import React, { useState } from 'react';
import { MapPin, Navigation, AlertCircle, CheckCircle, X } from 'lucide-react';
import '../styles/LocationPermissionRequest.css';

const LocationPermissionRequest = ({ onPermissionGranted, onPermissionDenied, onSkip }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState(null);

  const requestLocation = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      // Solicitar ubicación
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Tu navegador no soporta geolocalización'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => reject(error),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      });

      // Éxito - llamar callback
      if (onPermissionGranted) {
        onPermissionGranted(position);
      }

    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      
      let errorMessage = 'No se pudo obtener tu ubicación. ';
      switch(error.code) {
        case 1: // PERMISSION_DENIED
          errorMessage = 'Permisos de ubicación denegados. Puedes habilitarlos en la configuración del navegador.';
          if (onPermissionDenied) onPermissionDenied(error);
          break;
        case 2: // POSITION_UNAVAILABLE
          errorMessage = 'Tu ubicación no está disponible en este momento.';
          break;
        case 3: // TIMEOUT
          errorMessage = 'Tiempo de espera agotado. Intenta de nuevo.';
          break;
        default:
          errorMessage = 'Error desconocido al obtener la ubicación.';
          break;
      }
      
      setError(errorMessage);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  return (
    <div className="location-permission-overlay">
      <div className="location-permission-modal">
        {/* Close Button */}
        <button 
          className="close-button"
          onClick={handleSkip}
          disabled={isRequesting}
        >
          <X size={20} />
        </button>

        {/* Animated Background */}
        <div className="modal-background">
          <div className="floating-circle circle-1"></div>
          <div className="floating-circle circle-2"></div>
          <div className="floating-circle circle-3"></div>
        </div>

        {/* Header */}
        <div className="modal-header">
          <div className="location-icon">
            <div className="icon-pulse"></div>
            <Navigation size={32} />
          </div>
          <h2>🌟 ¡Descubre lo mejor cerca de ti!</h2>
          <p>
            TuGood TuGo necesita tu ubicación para mostrarte los comercios más cercanos 
            y ofrecerte la mejor experiencia.
          </p>
        </div>

        {/* Benefits */}
        <div className="benefits-section">
          <div className="benefit-item">
            <div className="benefit-icon">
              <CheckCircle size={18} />
            </div>
            <span>🏪 Encuentra comercios cerca de ti</span>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">
              <CheckCircle size={18} />
            </div>
            <span>📏 Calcula distancias precisas</span>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">
              <CheckCircle size={18} />
            </div>
            <span>🔔 Recibe notificaciones de ofertas cercanas</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            <p>{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button
            onClick={requestLocation}
            disabled={isRequesting}
            className="btn-primary"
          >
            {isRequesting ? (
              <>
                <div className="loading-spinner"></div>
                Obteniendo ubicación...
              </>
            ) : (
              <>
                <MapPin size={18} />
                ✨ Permitir ubicación
              </>
            )}
          </button>
          
          <button
            onClick={handleSkip}
            disabled={isRequesting}
            className="btn-secondary"
          >
            📍 Usar Chapinero por defecto
          </button>
        </div>

        {/* Privacy Note */}
        <div className="privacy-note">
          <div className="privacy-icon">🔒</div>
          <p>
            Tu ubicación solo se usa para mejorar tu experiencia y 
            <strong> no se comparte con terceros</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionRequest;
