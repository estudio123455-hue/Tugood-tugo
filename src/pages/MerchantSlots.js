import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, Users, Calendar, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';
import '../styles/MerchantSlots.css';

const MerchantSlots = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    capacidad: 1,
    precio_descuento: 0
  });

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/slots?comercio_id=${user.comercio_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('tugood_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSlots(data.slots || []);
      }
    } catch (error) {
      console.error('Error cargando slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('tugood_token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setSlots([data.slot, ...slots]);
        setShowCreateForm(false);
        setFormData({
          titulo: '',
          descripcion: '',
          fecha: '',
          hora_inicio: '',
          hora_fin: '',
          capacidad: 1,
          precio_descuento: 0
        });
      }
    } catch (error) {
      console.error('Error creando slot:', error);
    }
  };

  const handleCloseSlot = async (slotId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/slots/${slotId}/cerrar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('tugood_token')}`
        }
      });

      if (response.ok) {
        loadSlots();
      }
    } catch (error) {
      console.error('Error cerrando slot:', error);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-CO');
  };

  const formatTime = (timeStr) => {
    return timeStr.substring(0, 5);
  };

  const getStatusColor = (slot) => {
    if (!slot.activo) return '#ef4444';
    if (slot.disponible === 0) return '#f59e0b';
    return '#10b981';
  };

  const getStatusText = (slot) => {
    if (!slot.activo) return 'Cerrado';
    if (slot.disponible === 0) return 'Agotado';
    return 'Disponible';
  };

  return (
    <div className="merchant-slots">
      {/* Header */}
      <div className="slots-header">
        <div className="header-content">
          <button 
            className="back-btn"
            onClick={() => navigate('/merchant-panel')}
          >
            ← Volver
          </button>
          <h1>Franjas Horarias</h1>
          <button 
            className="create-btn"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus size={20} />
            Nueva Franja
          </button>
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Crear Nueva Franja Horaria</h2>
              <button 
                className="close-btn"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateSlot} className="slot-form">
              <div className="form-group">
                <label>Título (opcional)</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  placeholder="Ej: Almuerzo especial"
                />
              </div>

              <div className="form-group">
                <label>Descripción (opcional)</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Describe qué incluye esta franja"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha *</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label>Capacidad *</label>
                  <input
                    type="number"
                    value={formData.capacidad}
                    onChange={(e) => setFormData({...formData, capacidad: parseInt(e.target.value)})}
                    min="1"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hora Inicio *</label>
                  <input
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => setFormData({...formData, hora_inicio: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Hora Fin *</label>
                  <input
                    type="time"
                    value={formData.hora_fin}
                    onChange={(e) => setFormData({...formData, hora_fin: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Precio por unidad (opcional)</label>
                <input
                  type="number"
                  value={formData.precio_descuento}
                  onChange={(e) => setFormData({...formData, precio_descuento: parseFloat(e.target.value) || 0})}
                  min="0"
                  step="100"
                  placeholder="0"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="primary">
                  Crear Franja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slots List */}
      <div className="slots-content">
        {loading ? (
          <div className="loading">Cargando franjas...</div>
        ) : slots.length === 0 ? (
          <div className="empty-state">
            <Clock size={48} />
            <h3>No tienes franjas horarias</h3>
            <p>Crea tu primera franja para que los clientes puedan reservar</p>
            <button 
              className="create-first-btn"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus size={20} />
              Crear Primera Franja
            </button>
          </div>
        ) : (
          <div className="slots-grid">
            {slots.map((slot) => (
              <div key={slot.id} className="slot-card">
                <div className="slot-header">
                  <div className="slot-title">
                    {slot.titulo || 'Franja Horaria'}
                  </div>
                  <div 
                    className="slot-status"
                    style={{ color: getStatusColor(slot) }}
                  >
                    {getStatusText(slot)}
                  </div>
                </div>

                <div className="slot-details">
                  <div className="detail-item">
                    <Calendar size={16} />
                    <span>{formatDate(slot.fecha)}</span>
                  </div>
                  
                  <div className="detail-item">
                    <Clock size={16} />
                    <span>{formatTime(slot.hora_inicio)} - {formatTime(slot.hora_fin)}</span>
                  </div>
                  
                  <div className="detail-item">
                    <Users size={16} />
                    <span>{slot.disponible} / {slot.capacidad} disponibles</span>
                  </div>
                </div>

                {slot.descripcion && (
                  <div className="slot-description">
                    {slot.descripcion}
                  </div>
                )}

                {slot.precio_descuento > 0 && (
                  <div className="slot-price">
                    ${slot.precio_descuento.toLocaleString()} por unidad
                  </div>
                )}

                <div className="slot-actions">
                  {slot.activo && slot.disponible > 0 && (
                    <button 
                      className="close-slot-btn"
                      onClick={() => handleCloseSlot(slot.id)}
                    >
                      <EyeOff size={16} />
                      Cerrar Franja
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantSlots;
