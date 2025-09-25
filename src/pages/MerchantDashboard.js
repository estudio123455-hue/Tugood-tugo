import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Save,
  AlertCircle,
  CheckCircle,
  User,
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { authAPI } from '../services/api';
import '../styles/MerchantDashboard.css';

const MerchantDashboard = ({ user, city }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [stats, setStats] = useState({
    ventasHoy: 12,
    ingresosSemana: 450000,
    productosActivos: 25,
    clientesNuevos: 8
  });

  // Estados para nuevo horario
  const [nuevoHorario, setNuevoHorario] = useState({
    fecha: '',
    horaInicio: '',
    horaFin: '',
    productosDisponibles: 10,
    descripcion: 'Pack sorpresa del día',
    precio: 8000
  });

  // Verificar que el usuario sea comerciante
  useEffect(() => {
    const currentUser = user || authAPI.getCurrentUser();
    if (!currentUser || currentUser.tipo !== 'comercio') {
      navigate('/main');
    }
  }, [user, navigate]);

  // Cargar datos del comerciante
  useEffect(() => {
    loadMerchantData();
  }, []);

  const loadMerchantData = async () => {
    setLoading(true);
    try {
      // Simular carga de horarios existentes
      const horariosDemo = [
        {
          id: 1,
          fecha: '2024-01-15',
          horaInicio: '14:00',
          horaFin: '16:00',
          productosDisponibles: 8,
          productosVendidos: 2,
          estado: 'activo',
          descripcion: 'Pack sorpresa del día',
          precio: 8000
        },
        {
          id: 2,
          fecha: '2024-01-15',
          horaInicio: '18:00',
          horaFin: '20:00',
          productosDisponibles: 15,
          productosVendidos: 0,
          estado: 'programado',
          descripcion: 'Pack especial de cena',
          precio: 12000
        }
      ];
      
      setHorarios(horariosDemo);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHorario = async () => {
    if (!nuevoHorario.fecha || !nuevoHorario.horaInicio || !nuevoHorario.horaFin) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const horario = {
      id: Date.now(),
      ...nuevoHorario,
      productosVendidos: 0,
      estado: 'programado'
    };

    setHorarios([...horarios, horario]);
    setNuevoHorario({
      fecha: '',
      horaInicio: '',
      horaFin: '',
      productosDisponibles: 10,
      descripcion: 'Pack sorpresa del día',
      precio: 8000
    });
    setShowAddForm(false);
    
    alert('Horario agregado exitosamente');
  };

  const handleDeleteHorario = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este horario?')) {
      setHorarios(horarios.filter(h => h.id !== id));
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'activo': return '#10b981';
      case 'programado': return '#f59e0b';
      case 'cerrado': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getEstadoText = (horario) => {
    if (horario.productosVendidos >= horario.productosDisponibles) {
      return 'AGOTADO';
    }
    return horario.estado.toUpperCase();
  };

  if (loading) {
    return (
      <div className="merchant-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="merchant-dashboard">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <h1>🏪 Dashboard Comerciante</h1>
            <p>Bienvenido, {user?.nombre || 'Comerciante'}</p>
            <div className="location-info">
              <MapPin size={16} />
              <span>{city?.name || 'Bogotá'}</span>
            </div>
          </div>
          <div className="header-actions">
            <button onClick={() => navigate('/profile')} className="profile-btn">
              <User size={20} />
              Perfil
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon sales">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.ventasHoy}</h3>
              <p>Ventas Hoy</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon revenue">
              <DollarSign size={24} />
            </div>
            <div className="stat-content">
              <h3>${stats.ingresosSemana.toLocaleString()}</h3>
              <p>Ingresos Semana</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon products">
              <Package size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.productosActivos}</h3>
              <p>Productos Activos</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon customers">
              <User size={24} />
            </div>
            <div className="stat-content">
              <h3>{stats.clientesNuevos}</h3>
              <p>Clientes Nuevos</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="dashboard-tabs">
          <button 
            className={`tab ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveSection('dashboard')}
          >
            <BarChart3 size={20} />
            Dashboard
          </button>
          <button 
            className={`tab ${activeSection === 'horarios' ? 'active' : ''}`}
            onClick={() => setActiveSection('horarios')}
          >
            <Clock size={20} />
            Horarios
          </button>
          <button 
            className={`tab ${activeSection === 'productos' ? 'active' : ''}`}
            onClick={() => setActiveSection('productos')}
          >
            <Package size={20} />
            Productos
          </button>
        </div>

        {/* Dashboard Content */}
        {activeSection === 'dashboard' && (
          <div className="dashboard-content">
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <h3>📊 Resumen de Ventas</h3>
                <div className="chart-placeholder">
                  <p>Gráfico de ventas de la semana</p>
                  <div className="mock-chart">
                    <div className="bar" style={{height: '60%'}}></div>
                    <div className="bar" style={{height: '80%'}}></div>
                    <div className="bar" style={{height: '45%'}}></div>
                    <div className="bar" style={{height: '90%'}}></div>
                    <div className="bar" style={{height: '70%'}}></div>
                    <div className="bar" style={{height: '85%'}}></div>
                    <div className="bar" style={{height: '95%'}}></div>
                  </div>
                </div>
              </div>
              
              <div className="dashboard-card">
                <h3>🕒 Próximos Horarios</h3>
                <div className="upcoming-schedules">
                  {horarios.slice(0, 3).map(horario => (
                    <div key={horario.id} className="schedule-item">
                      <div className="schedule-time">
                        {horario.horaInicio} - {horario.horaFin}
                      </div>
                      <div className="schedule-info">
                        <span>{horario.descripcion}</span>
                        <small>{horario.productosDisponibles - horario.productosVendidos} disponibles</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Horarios Content */}
        {activeSection === 'horarios' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Gestión de Horarios</h2>
              <button 
                className="add-button"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus size={20} />
                Nuevo Horario
              </button>
            </div>

            {/* Formulario para agregar horario */}
            {showAddForm && (
              <div className="add-form">
                <h3>Nuevo Horario de Recogida</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Fecha</label>
                    <input
                      type="date"
                      value={nuevoHorario.fecha}
                      onChange={(e) => setNuevoHorario({...nuevoHorario, fecha: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <label>Hora de Inicio</label>
                    <input
                      type="time"
                      value={nuevoHorario.horaInicio}
                      onChange={(e) => setNuevoHorario({...nuevoHorario, horaInicio: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Hora de Fin</label>
                    <input
                      type="time"
                      value={nuevoHorario.horaFin}
                      onChange={(e) => setNuevoHorario({...nuevoHorario, horaFin: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Productos Disponibles</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={nuevoHorario.productosDisponibles}
                      onChange={(e) => setNuevoHorario({...nuevoHorario, productosDisponibles: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Precio por Pack (COP)</label>
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      value={nuevoHorario.precio}
                      onChange={(e) => setNuevoHorario({...nuevoHorario, precio: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Descripción</label>
                    <input
                      type="text"
                      placeholder="Ej: Pack sorpresa del día"
                      value={nuevoHorario.descripcion}
                      onChange={(e) => setNuevoHorario({...nuevoHorario, descripcion: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button onClick={() => setShowAddForm(false)} className="cancel-button">
                    Cancelar
                  </button>
                  <button onClick={handleAddHorario} className="save-button">
                    <Save size={20} />
                    Guardar Horario
                  </button>
                </div>
              </div>
            )}

            {/* Lista de horarios */}
            <div className="horarios-list">
              {horarios.length === 0 ? (
                <div className="empty-state">
                  <Clock size={48} />
                  <h3>No hay horarios programados</h3>
                  <p>Agrega tu primer horario de recogida</p>
                </div>
              ) : (
                horarios.map(horario => (
                  <div key={horario.id} className="horario-card">
                    <div className="horario-header">
                      <div className="horario-info">
                        <h4>{horario.descripcion}</h4>
                        <p>{new Date(horario.fecha).toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</p>
                      </div>
                      <div 
                        className="estado-badge"
                        style={{ backgroundColor: getEstadoColor(horario.estado) }}
                      >
                        {getEstadoText(horario)}
                      </div>
                    </div>
                    
                    <div className="horario-details">
                      <div className="detail-item">
                        <Clock size={16} />
                        <span>{horario.horaInicio} - {horario.horaFin}</span>
                      </div>
                      <div className="detail-item">
                        <Package size={16} />
                        <span>
                          {horario.productosDisponibles - horario.productosVendidos} disponibles 
                          de {horario.productosDisponibles}
                        </span>
                      </div>
                      <div className="detail-item">
                        <DollarSign size={16} />
                        <span>${horario.precio?.toLocaleString() || '8,000'} COP</span>
                      </div>
                    </div>

                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${(horario.productosVendidos / horario.productosDisponibles) * 100}%` 
                        }}
                      ></div>
                    </div>

                    <div className="horario-actions">
                      <button className="edit-button">
                        <Edit3 size={16} />
                        Editar
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteHorario(horario.id)}
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Productos Content */}
        {activeSection === 'productos' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Gestión de Productos</h2>
            </div>
            <div className="coming-soon">
              <Package size={48} />
              <h3>Próximamente</h3>
              <p>La gestión avanzada de productos estará disponible pronto</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantDashboard;
