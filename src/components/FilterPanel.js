import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

const FilterPanel = ({ filters, onFiltersChange, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const foodTypes = [
    { value: 'all', label: 'Todos', icon: '🏪' },
    { value: 'panadería', label: 'Panadería', icon: '🥖' },
    { value: 'corrientazo', label: 'Corrientazo', icon: '🍛' },
    { value: 'restaurante', label: 'Restaurante', icon: '🍽️' },
    { value: 'supermercado', label: 'Supermercado', icon: '🛒' },
    { value: 'saludable', label: 'Comida Saludable', icon: '🥗' },
    { value: 'comida-rapida', label: 'Comida Rápida', icon: '🍔' },
    { value: 'cafetería', label: 'Cafetería', icon: '☕' }
  ];

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters = {
      foodType: 'all',
      maxPrice: 50,
      maxDistance: 5,
      openNow: false
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onClose();
  };

  return (
    <div className="filter-overlay">
      <div className="filter-panel">
        <div className="filter-header">
          <h3>Filtros</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="filter-content">
          {/* Food Type Filter */}
          <div className="filter-section">
            <h4>Tipo de comida</h4>
            <div className="food-type-grid">
              {foodTypes.map((type) => (
                <button
                  key={type.value}
                  className={`food-type-btn ${localFilters.foodType === type.value ? 'selected' : ''}`}
                  onClick={() => handleFilterChange('foodType', type.value)}
                >
                  <span className="food-icon">{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Filter */}
          <div className="filter-section">
            <h4>Precio máximo</h4>
            <div className="price-slider">
              <input
                type="range"
                min="1"
                max="50"
                value={localFilters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', parseInt(e.target.value))}
                className="slider"
              />
              <div className="price-display">
                <span>Hasta ${localFilters.maxPrice * 1000} COP</span>
              </div>
            </div>
          </div>

          {/* Distance Filter */}
          <div className="filter-section">
            <h4>Distancia máxima</h4>
            <div className="distance-slider">
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={localFilters.maxDistance}
                onChange={(e) => handleFilterChange('maxDistance', parseFloat(e.target.value))}
                className="slider"
              />
              <div className="distance-display">
                <span>Hasta {localFilters.maxDistance} km</span>
              </div>
            </div>
          </div>

          {/* Open Now Filter */}
          <div className="filter-section">
            <div className="checkbox-filter">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={localFilters.openNow}
                  onChange={(e) => handleFilterChange('openNow', e.target.checked)}
                  className="checkbox"
                />
                <span className="checkmark">
                  {localFilters.openNow && <Check size={14} />}
                </span>
                <span>Solo abiertos ahora</span>
              </label>
            </div>
          </div>
        </div>

        <div className="filter-actions">
          <button className="btn btn-secondary reset-btn" onClick={handleResetFilters}>
            Limpiar filtros
          </button>
          <button className="btn btn-primary apply-btn" onClick={handleApplyFilters}>
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
