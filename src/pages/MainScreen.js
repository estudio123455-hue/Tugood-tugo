import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Clock, Euro, Star, Map, List, User, ShoppingCart, Package, Home, Settings, Store } from 'lucide-react';
import BusinessCard from '../components/BusinessCard';
import FilterPanel from '../components/FilterPanel';
import MapView from '../components/MapView';
import InteractiveMap from '../components/InteractiveMap';
import LocationPermissionRequest from '../components/LocationPermissionRequest';
import useGeolocation from '../hooks/useGeolocation';
import { comerciosAPI, packsAPI, authAPI } from '../services/api';
import { mockApiService } from '../services/mockApi';
import '../styles/MainScreen.css';
import '../styles/InteractiveMap.css';

const MainScreen = ({ user, city, onLogout }) => {
  const navigate = useNavigate();
  
  // Debug: verificar usuario
  console.log('MainScreen - Usuario recibido:', user);
  console.log('MainScreen - Tipo de usuario:', user?.tipo);
  
  // Redirigir comercios al panel
  useEffect(() => {
    if (user && user.tipo === 'comercio') {
      console.log('Usuario es comercio, redirigiendo al panel...');
      navigate('/merchant-panel');
    }
  }, [user, navigate]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    foodType: 'all',
    maxPrice: 50,
    maxDistance: 5,
    openNow: false
  });

  // State for businesses and packs data
  const [businesses, setBusinesses] = useState([]);
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [selectedComercio, setSelectedComercio] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showLocationRequest, setShowLocationRequest] = useState(false);
  const [locationRequested, setLocationRequested] = useState(false);
  
  // Hook de geolocalización
  const { 
    loading: locationLoading, 
    error: locationError, 
    position, 
    permissionStatus,
    getLocationWithRetry 
  } = useGeolocation();

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load comercios and packs using mock API directly
        const [comerciosResponse, packsResponse] = await Promise.all([
          mockApiService.getComercios({ limit: 50 }),
          mockApiService.getPacks({ limit: 50 })
        ]);

        // Transform comercios data to match expected format
        const transformedBusinesses = comerciosResponse.comercios.map(comercio => ({
          id: comercio.id,
          name: comercio.nombre,
          type: comercio.tipo_comida,
          rating: comercio.calificacion || 4.5,
          distance: 0.5,
          originalPrice: 15000,
          discountPrice: 8000,
          itemsAvailable: comercio.packs?.length || 2,
          closingTime: comercio.horario.split(' - ')[1] || '22:00',
          image: comercio.imagen || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop',
          coords: comercio.coordenadas || { lat: 4.6351, lng: -74.0669 },
          description: comercio.descripcion || 'Comercio local',
          direccion: comercio.direccion,
          zona: comercio.zona,
          telefono: comercio.telefono,
          tiempo_entrega: comercio.tiempo_entrega,
          costo_envio: comercio.costo_envio,
          activo: comercio.activo
        }));

        setBusinesses(transformedBusinesses);
        setPacks(packsResponse.packs || []);
      } catch (err) {
        console.error('Error loading data:', err);
        // Cargar datos de fallback si hay error
        try {
          const fallbackData = await mockApiService.getComercios();
          const transformedBusinesses = fallbackData.comercios.map(comercio => ({
            id: comercio.id,
            name: comercio.nombre,
            type: comercio.tipo_comida,
            rating: comercio.calificacion || 4.5,
            distance: 0.5,
            originalPrice: 15000,
            discountPrice: 8000,
            itemsAvailable: comercio.packs?.length || 2,
            closingTime: '22:00',
            image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop',
            coords: comercio.coordenadas || { lat: 4.6351, lng: -74.0669 },
            description: comercio.descripcion,
            direccion: comercio.direccion,
            zona: comercio.zona,
            telefono: comercio.telefono,
            tiempo_entrega: comercio.tiempo_entrega,
            costo_envio: comercio.costo_envio,
            activo: comercio.activo
          }));
          
          setBusinesses(transformedBusinesses);
          const packsData = await mockApiService.getPacks();
          setPacks(packsData.packs || []);
          setError(null); // Limpiar error si el fallback funciona
        } catch (fallbackErr) {
          console.error('Error with fallback data:', fallbackErr);
          setError('Error cargando datos. Intenta nuevamente.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Manejar geolocalización mejorada
  useEffect(() => {
    const initializeLocation = async () => {
      // Si ya tenemos una ubicación, no hacer nada
      if (userLocation) return;
      
      // Verificar si ya se denegaron los permisos
      if (permissionStatus === 'denied') {
        setUserLocation({
          coords: { lat: 4.6097, lng: -74.0817 },
          name: city?.name || 'Bogotá (ubicación por defecto)'
        });
        return;
      }
      
      // Si los permisos están concedidos, obtener ubicación
      if (permissionStatus === 'granted') {
        try {
          const position = await getLocationWithRetry();
          setUserLocation({
            coords: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            },
            name: city?.name || 'Tu ubicación'
          });
        } catch (error) {
          console.warn('Error getting location:', error);
          setUserLocation({
            coords: { lat: 4.6097, lng: -74.0817 },
            name: city?.name || 'Bogotá (ubicación por defecto)'
          });
        }
      } else if (permissionStatus === 'prompt' && !locationRequested) {
        // Mostrar modal para solicitar permisos solo una vez
        setShowLocationRequest(true);
        setLocationRequested(true);
      }
    };

    initializeLocation();
  }, [permissionStatus, city, userLocation, getLocationWithRetry]);

  // Filter businesses based on search and filters
  useEffect(() => {
    // Only filter if we have businesses data
    if (businesses.length === 0) {
      setFilteredBusinesses([]);
      return;
    }

    let filtered = businesses;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(business =>
        business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (business.description && business.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply food type filter
    if (filters.foodType !== 'all') {
      filtered = filtered.filter(business => business.type === filters.foodType);
    }

    // Apply price filter (based on available packs)
    if (filters.maxPrice < 50 && packs.length > 0) {
      const affordablePacks = packs.filter(pack => pack.precio_descuento <= filters.maxPrice * 1000);
      const affordableComercioIds = [...new Set(affordablePacks.map(pack => pack.comercio_id))];
      filtered = filtered.filter(business => affordableComercioIds.includes(business.id));
    }

    // Apply distance filter
    filtered = filtered.filter(business => business.distance <= filters.maxDistance);

    // Apply open now filter
    if (filters.openNow) {
      const now = new Date();
      const currentTime = now.getHours() * 100 + now.getMinutes();
      filtered = filtered.filter(business => {
        const closingTime = parseInt(business.closingTime.replace(':', ''));
        return currentTime < closingTime;
      });
    }

    setFilteredBusinesses(filtered);
  }, [searchTerm, filters, businesses, packs]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Manejar cuando se conceden los permisos de ubicación
  const handleLocationPermissionGranted = (position) => {
    setUserLocation({
      coords: {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      },
      name: city?.name || 'Tu ubicación'
    });
    setShowLocationRequest(false);
  };

  // Manejar cuando se deniegan los permisos
  const handleLocationPermissionDenied = () => {
    setUserLocation({
      coords: { lat: 4.6097, lng: -74.0817 },
      name: city?.name || 'Bogotá (ubicación por defecto)'
    });
    setShowLocationRequest(false);
  };

  // Manejar cuando el usuario decide omitir la ubicación
  const handleLocationSkip = () => {
    setUserLocation({
      coords: { lat: 4.6097, lng: -74.0817 },
      name: city?.name || 'Bogotá (ubicación por defecto)'
    });
    setShowLocationRequest(false);
  };

  return (
    <div className="main-screen">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="location-info">
            <MapPin size={16} />
            <span>{city?.name || 'Bogotá'}</span>
          </div>
          <div className="user-actions">
            {user && user.tipo === 'comercio' && (
              <button 
                className="merchant-panel-btn"
                onClick={() => navigate('/merchant-panel')}
              >
                🏪 Panel
              </button>
            )}
            <button className="user-btn avatar-style" onClick={() => navigate('/profile')}>
              <User size={20} />
            </button>
          </div>
        </div>
      </div>

      
      <div className="main-content">
        <div className="content-header">
          <h2>Comercios cerca de ti</h2>
          <p>Encuentra ofertas increíbles en {city?.name || 'tu zona'}</p>
        </div>
          
        <div className="search-bar">
          <div className="search-input-container">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Buscar comercios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button 
            className="filter-btn"
            onClick={() => setShowFilters(true)}
          >
            <Filter size={20} />
          </button>
        </div>

        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List size={18} />
            Lista
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => setViewMode('map')}
          >
            <Map size={18} />
            Mapa
          </button>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando comercios...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h3>Error al cargar datos</h3>
            <p>{error}</p>
            <button 
              className="retry-btn"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="businesses-list">
            <div className="container">
              <div className="results-header">
                <h2>{filteredBusinesses.length} comercios disponibles</h2>
                <p>Cerca de {city.name}</p>
              </div>
              
              <div className="businesses-grid">
                {filteredBusinesses.map((business) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>

              {filteredBusinesses.length === 0 && !loading && (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <h3>No se encontraron resultados</h3>
                  <p>Intenta ajustar los filtros o buscar algo diferente</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="map-container">
            <InteractiveMap 
              comercios={businesses}
              selectedComercio={selectedComercio}
              onComercioSelect={setSelectedComercio}
              userLocation={userLocation}
            />
          </div>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onFiltersChange={handleFilterChange}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button 
          className="nav-item active"
          onClick={() => navigate('/main')}
        >
          <Home size={20} />
          <span>Inicio</span>
        </button>
        <button 
          className="nav-item"
          onClick={() => navigate('/cart')}
        >
          <ShoppingCart size={20} />
          <span>Carrito</span>
        </button>
        <button 
          className="nav-item"
          onClick={() => navigate('/pedidos-activos')}
        >
          <Package size={20} />
          <span>Pedidos</span>
        </button>
        <button 
          className="nav-item"
          onClick={() => navigate('/profile')}
        >
          <User size={20} />
          <span>Perfil</span>
        </button>
        {user && user.tipo === 'comercio' && (
          <button 
            className="nav-item"
            onClick={() => navigate('/merchant-panel')}
          >
            <Store size={20} />
            <span>Panel</span>
          </button>
        )}
      </div>

      {/* Location Permission Request Modal */}
      {showLocationRequest && (
        <LocationPermissionRequest
          onPermissionGranted={handleLocationPermissionGranted}
          onPermissionDenied={handleLocationPermissionDenied}
          onSkip={handleLocationSkip}
        />
      )}
    </div>
  );
};

export default MainScreen;
