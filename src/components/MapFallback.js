import React from 'react';
import { MapPin, Settings, ExternalLink } from 'lucide-react';

const MapFallback = ({ comercios = [], selectedComercio, onComercioSelect, userLocation }) => {
  return (
    <div className="map-fallback">
      {/* Header */}
      <div className="map-header">
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

      {/* Map Placeholder */}
      <div className="relative bg-gradient-to-br from-blue-50 to-green-50 h-96 flex items-center justify-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#10B981" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="text-center z-10 max-w-md px-6">
          <div className="mb-6">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings size={32} className="text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Configuración de Google Maps
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Para ver el mapa interactivo, necesitas configurar una API Key de Google Maps.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-left">
            <h4 className="font-medium text-gray-800 mb-2">Pasos para configurar:</h4>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Ve a Google Cloud Console</li>
              <li>2. Crea una nueva API Key</li>
              <li>3. Habilita "Maps JavaScript API"</li>
              <li>4. Agrega la key al archivo .env</li>
            </ol>
            <a 
              href="https://console.cloud.google.com/apis/credentials" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <ExternalLink size={14} />
              Abrir Google Cloud Console
            </a>
          </div>
        </div>

        {/* Simulated Markers */}
        <div className="absolute inset-0 pointer-events-none">
          {comercios.slice(0, 5).map((comercio, index) => (
            <div
              key={comercio.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${30 + (index * 15)}%`,
                top: `${40 + (index % 2 === 0 ? 10 : -10)}%`
              }}
            >
              <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <span className="text-white text-xs">🏪</span>
              </div>
            </div>
          ))}
          
          {/* User location marker */}
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: '50%', top: '60%' }}
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <span className="text-white text-xs">📍</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comercios List */}
      <div className="p-4 bg-gray-50">
        <h4 className="font-medium text-gray-800 mb-3">Comercios disponibles:</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {comercios.slice(0, 3).map((comercio) => (
            <div 
              key={comercio.id}
              className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-amber-300 transition-colors"
              onClick={() => onComercioSelect && onComercioSelect(comercio)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">🏪</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{comercio.nombre}</p>
                  <p className="text-gray-500 text-xs">{comercio.zona_bogota}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-amber-600 font-medium text-sm">
                  ⭐ {comercio.rating || 'N/A'}
                </p>
              </div>
            </div>
          ))}
          
          {comercios.length > 3 && (
            <div className="text-center py-2">
              <p className="text-gray-500 text-sm">
                +{comercios.length - 3} comercios más
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapFallback;
