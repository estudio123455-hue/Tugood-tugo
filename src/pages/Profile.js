import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, CreditCard, Bell, MapPin, LogOut, Edit2, ChevronRight, Leaf, DollarSign, Utensils } from 'lucide-react';
import { usersAPI, pagosAPI } from '../services/api';
import '../styles/Profile.css';

const Profile = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Usuario',
    email: user?.email || '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [impactStats, setImpactStats] = useState({
    foodSaved: 0, // kg de comida salvada
    moneySaved: 0, // dinero ahorrado en COP
    co2Reduced: 0 // kg de CO2 reducido
  });

  const [preferences, setPreferences] = useState({
    notifications: true,
    emailUpdates: false,
    smsUpdates: true,
    favoriteZones: ['Chapinero', 'Zona Rosa']
  });

  // Load user profile and payment methods
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);
        
        // Load user profile
        const profile = await usersAPI.getProfile();
        setProfileData({
          name: profile.user.nombre,
          email: profile.user.email,
          phone: profile.user.telefono || '300-000-0000',
          city: profile.user.ciudad || 'Bogotá'
        });
        
        const methods = await pagosAPI.getPaymentMethods();
        setPaymentMethods(methods.metodos || []);
        
        // Calculate impact statistics (mock data for now)
        // En una implementación real, esto vendría de una API de estadísticas
        const totalOrders = Math.floor(Math.random() * 50) + 10; // 10-60 pedidos
        const avgPackWeight = 0.8; // kg promedio por pack
        const avgSavings = 12000; // COP promedio ahorrado por pack
        const co2PerKg = 2.5; // kg CO2 por kg de comida salvada
        
        setImpactStats({
          foodSaved: Math.round(totalOrders * avgPackWeight * 10) / 10, // Redondear a 1 decimal
          moneySaved: totalOrders * avgSavings,
          co2Reduced: Math.round(totalOrders * avgPackWeight * co2PerKg * 10) / 10
        });
        
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, []);

  const handleProfileUpdate = async () => {
    try {
      setSaving(true);
      
      const updateData = {
        nombre: profileData.name,
        telefono: profileData.phone
      };
      
      await usersAPI.updateProfile(updateData);
      setEditingProfile(false);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Error actualizando perfil');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSwitchToMerchant = () => {
    if (window.confirm('¿Quieres cambiar tu cuenta a tipo Comercio? Podrás vender excedentes de comida.')) {
      // Actualizar el tipo de usuario en localStorage
      const currentUser = JSON.parse(localStorage.getItem('tugood_user') || '{}');
      const updatedUser = { ...currentUser, tipo: 'comercio' };
      localStorage.setItem('tugood_user', JSON.stringify(updatedUser));
      
      alert('¡Cuenta cambiada a Comercio exitosamente! Recarga la página para ver los cambios.');
      window.location.reload();
    }
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      // Clear localStorage
      localStorage.removeItem('tugood_token');
      localStorage.removeItem('tugood_cart');
      localStorage.removeItem('tugood_user');
      
      if (onLogout) {
        onLogout();
      } else {
        // Fallback: reload page to trigger auth check
        window.location.reload();
      }
    }
  };

  const handleAddPaymentMethod = () => {
    // TODO: Implement add payment method modal
    alert('Funcionalidad de agregar método de pago próximamente');
  };

  const handleEditZones = () => {
    // TODO: Implement edit favorite zones
    alert('Funcionalidad de editar zonas favoritas próximamente');
  };

  if (loading) {
    return (
      <div className="profile-screen">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-screen">
      <div className="container">
        <div className="profile-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Perfil</h1>
        </div>

        <div className="profile-content">
          {/* User Info Section */}
          <div className="profile-section">
            <div className="section-header">
              <h2>Información Personal</h2>
              <button 
                className="edit-button"
                onClick={() => setEditingProfile(!editingProfile)}
              >
                <Edit2 size={16} />
                {editingProfile ? 'Cancelar' : 'Editar'}
              </button>
            </div>

            <div className="user-info-card">
              <div className="user-avatar">
                <User size={32} />
              </div>
              <div className="user-details">
                {editingProfile ? (
                  <div className="edit-form">
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      className="edit-input"
                      placeholder="Nombre completo"
                    />
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      className="edit-input"
                      placeholder="Correo electrónico"
                    />
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      className="edit-input"
                      placeholder="Teléfono"
                    />
                    <button 
                      className="save-button" 
                      onClick={handleProfileUpdate}
                      disabled={saving}
                    >
                      {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                ) : (
                  <>
                    <h3>{profileData.name}</h3>
                    <p>{profileData.email}</p>
                    <p>{profileData.phone}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Impact Statistics */}
          <div className="profile-section">
            <div className="section-header">
              <h2>Tu Impacto Ambiental</h2>
            </div>
            
            <div className="impact-stats">
              <div className="impact-card food-saved">
                <div className="impact-icon">
                  <Utensils size={24} />
                </div>
                <div className="impact-content">
                  <h3>{impactStats.foodSaved} kg</h3>
                  <p>Comida salvada</p>
                  <span className="impact-description">Evitaste que esta comida fuera desperdiciada</span>
                </div>
              </div>

              <div className="impact-card money-saved">
                <div className="impact-icon">
                  <DollarSign size={24} />
                </div>
                <div className="impact-content">
                  <h3>${impactStats.moneySaved.toLocaleString('es-CO')}</h3>
                  <p>Dinero ahorrado</p>
                  <span className="impact-description">Ahorro total en tus compras</span>
                </div>
              </div>

              <div className="impact-card co2-reduced">
                <div className="impact-icon">
                  <Leaf size={24} />
                </div>
                <div className="impact-content">
                  <h3>{impactStats.co2Reduced} kg</h3>
                  <p>CO₂ reducido</p>
                  <span className="impact-description">Emisiones evitadas al salvar comida</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="profile-section">
            <div className="section-header">
              <h2>Métodos de Pago</h2>
              <button className="add-button" onClick={handleAddPaymentMethod}>
                + Agregar
              </button>
            </div>

            <div className="payment-methods">
              {paymentMethods.length > 0 ? (
                paymentMethods.map((method) => (
                  <div key={method.id} className="payment-method-item">
                    <div className="payment-icon">
                      <CreditCard size={20} />
                    </div>
                    <div className="payment-details">
                      <span className="payment-type">
                        {method.nombre}
                      </span>
                      <span className="payment-desc">{method.descripcion}</span>
                    </div>
                    <ChevronRight size={16} />
                  </div>
                ))
              ) : (
                <div className="empty-payment-methods">
                  <p>No tienes métodos de pago guardados</p>
                </div>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div className="profile-section">
            <div className="section-header">
              <h2>Preferencias</h2>
            </div>

            <div className="preferences">
              <div className="preference-item">
                <div className="preference-info">
                  <Bell size={20} />
                  <div>
                    <h4>Notificaciones push</h4>
                    <p>Recibe alertas de nuevas ofertas</p>
                  </div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={preferences.notifications}
                    onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="preference-item" onClick={handleEditZones}>
                <div className="preference-info">
                  <MapPin size={20} />
                  <div>
                    <h4>Zonas favoritas</h4>
                    <p>{preferences.favoriteZones.join(', ')}</p>
                  </div>
                </div>
                <ChevronRight size={16} />
              </div>

              <div className="preference-item">
                <div className="preference-info">
                  <div className="icon-placeholder">📧</div>
                  <div>
                    <h4>Correos promocionales</h4>
                    <p>Recibe ofertas especiales por email</p>
                  </div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={preferences.emailUpdates}
                    onChange={(e) => handlePreferenceChange('emailUpdates', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Account Type */}
          <div className="profile-section">
            <div className="section-header">
              <h2>Tipo de Cuenta</h2>
            </div>
            <div className="account-type-info">
              <div className="current-type">
                <span className="type-badge">
                  {user?.tipo === 'comercio' ? '🏪 Comercio' : '🛒 Cliente'}
                </span>
                <p>
                  {user?.tipo === 'comercio' 
                    ? 'Puedes vender excedentes de comida' 
                    : 'Puedes comprar packs de comida'
                  }
                </p>
              </div>
              {user?.tipo === 'cliente' && (
                <button 
                  className="switch-account-btn"
                  onClick={() => handleSwitchToMerchant()}
                >
                  🏪 Cambiar a Comercio
                </button>
              )}
            </div>
          </div>

          {/* App Info */}
          <div className="profile-section">
            <div className="section-header">
              <h2>Información</h2>
            </div>

            <div className="info-items">
              <div className="info-item">
                <span>Términos y condiciones</span>
                <ChevronRight size={16} />
              </div>
              <div className="info-item">
                <span>Política de privacidad</span>
                <ChevronRight size={16} />
              </div>
              <div className="info-item">
                <span>Ayuda y soporte</span>
                <ChevronRight size={16} />
              </div>
              <div className="info-item">
                <span>Versión de la app</span>
                <span className="version">1.0.0</span>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="profile-section">
            <button className="logout-button" onClick={handleLogout}>
              <LogOut size={20} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
