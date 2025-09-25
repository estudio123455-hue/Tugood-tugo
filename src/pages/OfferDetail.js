import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Star, Heart, ShoppingCart } from 'lucide-react';
import { packsAPI, usersAPI } from '../services/api';
import '../styles/OfferDetail.css';

const OfferDetail = ({ user, onReserve }) => {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reserving, setReserving] = useState(false);

  // Load pack data from API
  useEffect(() => {
    const loadOffer = async () => {
      try {
        setLoading(true);
        const packData = await packsAPI.getById(offerId);
        
        // Transform pack data to offer format
        const transformedOffer = {
          id: packData.pack.id,
          businessId: packData.pack.comercio_id,
          businessName: packData.pack.comercio_nombre,
          businessType: packData.pack.comercio_tipo || 'Comercio',
          rating: packData.pack.comercio_rating || 4.0,
          reviewCount: 127,
          images: [
            `https://picsum.photos/400/300?random=${packData.pack.id}1`,
            `https://picsum.photos/400/300?random=${packData.pack.id}2`,
            `https://picsum.photos/400/300?random=${packData.pack.id}3`
          ],
          title: packData.pack.nombre,
          description: packData.pack.descripcion,
          originalPrice: packData.pack.precio_original,
          discountedPrice: packData.pack.precio_oferta,
          discount: Math.round(((packData.pack.precio_original - packData.pack.precio_oferta) / packData.pack.precio_original) * 100),
          pickupTimeStart: '12:00',
          pickupTimeEnd: '14:00',
          address: packData.pack.comercio_direccion || 'Bogotá, Colombia',
          coordinates: { 
            lat: 4.6097, 
            lng: -74.0817 
          },
          availableQuantity: packData.pack.cantidad_disponible || 5,
          distance: '0.8 km'
        };
        
        setOffer(transformedOffer);
      } catch (err) {
        console.error('Error loading offer:', err);
        setError('Error cargando la oferta');
      } finally {
        setLoading(false);
      }
    };

    loadOffer();
  }, [offerId]);

  const handleReserve = async () => {
    try {
      setReserving(true);
      
      // Add to cart in localStorage for now
      const cart = JSON.parse(localStorage.getItem('tugood_cart') || '[]');
      const existingItem = cart.find(item => item.id === offer.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          id: offer.id,
          name: offer.title,
          businessName: offer.businessName,
          businessId: offer.businessId,
          price: offer.discountedPrice,
          originalPrice: offer.originalPrice,
          image: offer.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop',
          quantity: 1,
          pickupTime: `${offer.pickupTimeStart || '12:00'} - ${offer.pickupTimeEnd || '14:00'}`,
          address: offer.address || 'Dirección no disponible'
        });
      }
      
      localStorage.setItem('tugood_cart', JSON.stringify(cart));
      
      // Show success feedback
      alert('¡Producto agregado al carrito!');
      
      if (onReserve) {
        onReserve(offer);
      }
      
      // Navigate to cart after a brief delay
      setTimeout(() => {
        navigate('/cart');
      }, 500);
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Error al agregar al carrito');
    } finally {
      setReserving(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      // TODO: Implement favorites API call
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === offer.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? offer.images.length - 1 : prev - 1
    );
  };

  if (loading) {
    return (
      <div className="offer-detail">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando oferta...</p>
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="offer-detail">
        <div className="error-container">
          <h3>Error</h3>
          <p>{error || 'Oferta no encontrada'}</p>
          <button onClick={() => navigate(-1)}>Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="offer-detail">
      {/* Header */}
      <div className="offer-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <button 
          className={`favorite-button ${isFavorite ? 'active' : ''}`}
          onClick={handleToggleFavorite}
        >
          <Heart size={24} fill={isFavorite ? '#ff6b6b' : 'none'} />
        </button>
      </div>

      {/* Image Carousel */}
      <div className="image-carousel">
        <div className="image-container">
          <img 
            src={offer.images[currentImageIndex]} 
            alt={`${offer.title} - Imagen ${currentImageIndex + 1}`}
            className="offer-image"
          />
          {offer.images.length > 1 && (
            <>
              <button className="carousel-button prev" onClick={prevImage}>
                ‹
              </button>
              <button className="carousel-button next" onClick={nextImage}>
                ›
              </button>
              <div className="image-indicators">
                {offer.images.map((_, index) => (
                  <div 
                    key={index}
                    className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="offer-content">
        {/* Business Info */}
        <div className="business-info">
          <div className="business-header">
            <h1 className="business-name">{offer.businessName}</h1>
            <div className="business-meta">
              <span className="business-type">{offer.businessType}</span>
              <div className="rating">
                <Star size={16} fill="#ffd700" color="#ffd700" />
                <span>{offer.rating}</span>
                <span className="review-count">({offer.reviewCount})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Offer Details */}
        <div className="offer-info">
          <h2 className="offer-title">{offer.title}</h2>
          <p className="offer-description">{offer.description}</p>
          
          {/* Pricing */}
          <div className="pricing">
            <div className="price-container">
              <span className="original-price">${(offer.originalPrice * 4000).toLocaleString()} COP</span>
              <span className="discounted-price">${(offer.discountedPrice * 4000).toLocaleString()} COP</span>
            </div>
            <div className="discount-badge">
              -{offer.discount}%
            </div>
          </div>

          {/* Pickup Time */}
          <div className="pickup-info">
            <div className="info-item">
              <Clock size={20} />
              <div>
                <h3>Horario de Recogida</h3>
                <p>Hoy, {offer.pickupTimeStart} - {offer.pickupTimeEnd}</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="location-info">
            <div className="info-item">
              <MapPin size={20} />
              <div>
                <h3>Ubicación</h3>
                <p>{offer.address}</p>
                <span className="distance">{offer.distance} de distancia</span>
              </div>
            </div>
            <div className="map-placeholder">
              <div className="map-container">
                {/* Aquí iría el mapa real con Google Maps */}
                <div className="map-mock">
                  <MapPin size={32} />
                  <p>Mapa interactivo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="availability">
            <p className="quantity-left">
              {offer.availableQuantity} pack{offer.availableQuantity !== 1 ? 's' : ''} disponible{offer.availableQuantity !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Reserve Button */}
      <div className="reserve-section">
        <button 
          className="reserve-button"
          onClick={handleReserve}
          disabled={offer.availableQuantity === 0 || reserving}
        >
          {reserving ? (
            <>
              <div className="loading-spinner small"></div>
              Agregando...
            </>
          ) : offer.availableQuantity > 0 ? (
            <>
              <ShoppingCart size={20} />
              Agregar al Carrito
            </>
          ) : (
            'Agotado'
          )}
        </button>
      </div>
    </div>
  );
};

export default OfferDetail;
