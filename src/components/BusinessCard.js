import React from 'react';
import { MapPin, Clock, Star, Euro } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BusinessCard = ({ business }) => {
  const navigate = useNavigate();
  const discountPercentage = Math.round(((business.originalPrice - business.discountPrice) / business.originalPrice) * 100);

  const handleCardClick = () => {
    // Navegar al primer pack disponible del comercio
    // En el futuro esto podría ser una página de comercio con todos sus packs
    const firstPackId = business.itemsAvailable > 0 ? business.id : 1;
    navigate(`/offer/${firstPackId}`);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'panadería':
        return '🥖';
      case 'corrientazo':
        return '🍛';
      case 'restaurante':
        return '🍽️';
      case 'supermercado':
        return '🛒';
      case 'saludable':
        return '🥗';
      case 'comida-rapida':
        return '🍔';
      case 'cafetería':
        return '☕';
      default:
        return '🏪';
    }
  };

  const getBusinessImage = (type) => {
    const images = {
      'panadería': 'https://picsum.photos/300/200?random=1',
      'Panadería': 'https://picsum.photos/300/200?random=1',
      'corrientazo': 'https://picsum.photos/300/200?random=2',
      'Comida Casera': 'https://picsum.photos/300/200?random=2',
      'restaurante': 'https://picsum.photos/300/200?random=3',
      'Pizza': 'https://picsum.photos/300/200?random=3',
      'supermercado': 'https://picsum.photos/300/200?random=4',
      'saludable': 'https://picsum.photos/300/200?random=5',
      'comida-rapida': 'https://picsum.photos/300/200?random=6',
      'cafetería': 'https://picsum.photos/300/200?random=7',
      'default': 'https://picsum.photos/300/200?random=8'
    };
    return images[type] || images['default'];
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'panadería':
      case 'Panadería':
        return '#ff6b35';
      case 'corrientazo':
      case 'Comida Casera':
        return '#4caf50';
      case 'restaurante':
      case 'Pizza':
        return '#f44336';
      case 'supermercado':
        return '#4caf50';
      case 'saludable':
        return '#8bc34a';
      case 'comida-rapida':
        return '#ffc107';
      case 'cafetería':
        return '#795548';
      default:
        return '#9e9e9e';
    }
  };

  return (
    <div className="business-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <div className="business-image">
        <img 
          src={getBusinessImage(business.type)} 
          alt={business.name}
          onError={(e) => {
            e.target.src = getBusinessImage('default');
          }}
          loading="lazy"
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            backgroundColor: '#f3f4f6'
          }}
        />
        <div className="discount-badge">
          -{discountPercentage}%
        </div>
        <div className="type-badge" style={{ backgroundColor: getTypeColor(business.type) }}>
          <span className="type-icon">{getTypeIcon(business.type)}</span>
          {business.type}
        </div>
      </div>

      <div className="business-info">
        <div className="business-header">
          <h3 className="business-name">{business.name}</h3>
          <div className="business-rating">
            <Star size={14} fill="currentColor" />
            <span>{business.rating}</span>
          </div>
        </div>

        <p className="business-description">{business.description}</p>

        <div className="business-details">
          <div className="detail-item">
            <MapPin size={14} />
            <span>{business.distance} km</span>
          </div>
          <div className="detail-item">
            <Clock size={14} />
            <span>Hasta {business.closingTime}</span>
          </div>
        </div>

        <div className="business-pricing">
          <div className="price-info">
            <span className="original-price">${(business.originalPrice * 4000).toLocaleString()} COP</span>
            <span className="discount-price">${(business.discountPrice * 4000).toLocaleString()} COP</span>
          </div>
          <div className="items-available">
            {business.itemsAvailable} disponible{business.itemsAvailable !== 1 ? 's' : ''}
          </div>
        </div>

        <button 
          className="reserve-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
        >
          Ver detalles
        </button>
      </div>
    </div>
  );
};

export default BusinessCard;
