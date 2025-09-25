import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const GoogleMap = ({ 
  center = { lat: 4.6097, lng: -74.0817 }, // Bogotá por defecto
  zoom = 13,
  markers = [],
  onMarkerClick,
  height = '400px',
  width = '100%',
  className = ''
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const markersRef = useRef([]);

  useEffect(() => {
    const initMap = async () => {
      try {
        // Verificar si tenemos una API key válida
        const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        if (!apiKey || apiKey === 'TU_API_KEY_AQUI') {
          throw new Error('API Key de Google Maps no configurada');
        }

        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry']
        });

        await loader.load();
        
        if (mapRef.current) {
          const mapInstance = new window.google.maps.Map(mapRef.current, {
            center,
            zoom,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              },
              {
                featureType: 'transit',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ],
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControlOptions: {
              position: window.google.maps.ControlPosition.RIGHT_CENTER
            }
          });

          setMap(mapInstance);
          setIsLoaded(true);
        }
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError('Error al cargar el mapa. Verifica la configuración de la API key.');
      }
    };

    initMap();
  }, [center.lat, center.lng, zoom]);

  // Actualizar marcadores cuando cambien
  useEffect(() => {
    if (!map || !isLoaded) return;

    // Limpiar marcadores existentes
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Agregar nuevos marcadores
    markers.forEach((markerData, index) => {
      const marker = new window.google.maps.Marker({
        position: { lat: markerData.lat, lng: markerData.lng },
        map,
        title: markerData.title || `Marcador ${index + 1}`,
        icon: markerData.icon || {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#F59E0B" stroke="#FFFFFF" stroke-width="3"/>
              <circle cx="16" cy="16" r="6" fill="#FFFFFF"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16)
        }
      });

      // Agregar info window si hay información adicional
      if (markerData.info) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1a202c;">${markerData.info.title}</h3>
              ${markerData.info.description ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #4a5568;">${markerData.info.description}</p>` : ''}
              ${markerData.info.address ? `<p style="margin: 0; font-size: 12px; color: #718096;"><strong>📍</strong> ${markerData.info.address}</p>` : ''}
              ${markerData.info.rating ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #718096;"><strong>⭐</strong> ${markerData.info.rating}/5</p>` : ''}
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
          if (onMarkerClick) {
            onMarkerClick(markerData, index);
          }
        });
      } else if (onMarkerClick) {
        marker.addListener('click', () => {
          onMarkerClick(markerData, index);
        });
      }

      markersRef.current.push(marker);
    });

    // Ajustar vista para mostrar todos los marcadores
    if (markers.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach(marker => {
        bounds.extend({ lat: marker.lat, lng: marker.lng });
      });
      map.fitBounds(bounds);
    }
  }, [map, markers, onMarkerClick, isLoaded]);

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg ${className}`}
        style={{ height, width }}
      >
        <div className="text-center p-6">
          <div className="text-4xl mb-4">🗺️</div>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <div 
        ref={mapRef} 
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Cargando mapa...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMap;
