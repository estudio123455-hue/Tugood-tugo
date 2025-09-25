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
  CheckCircle
} from 'lucide-react';
import { authAPI } from '../services/api';
import '../styles/MerchantPanel.css';

const MerchantPanel = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('horarios');
  const [horarios, setHorarios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Estados para nuevo horario
  const [nuevoHorario, setNuevoHorario] = useState({
    fecha: '',
    horaInicio: '',
    horaFin: '',
    productosDisponibles: 10,
    descripcion: 'Pack sorpresa del día'
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
          descripcion: 'Pack sorpresa del día'
        },
        {
          id: 2,
          fecha: '2024-01-15',
          horaInicio: '18:00',
          horaFin: '20:00',
          productosDisponibles: 15,
          productosVendidos: 0,
          estado: 'programado',
          descripcion: 'Pack especial de cena'
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
      descripcion: 'Pack sorpresa del día'
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
      <div className="merchant-panel">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando panel de comerciante...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="merchant-panel">
      <div className="container">
        {/* Header */}
        <div className="panel-header">
          <button onClick={() => navigate('/main')} className="back-button">
            <ArrowLeft size={24} />
          </button>
          <div className="header-info">
            <h1>Panel de Comerciante</h1>
            <p>Gestiona tus horarios y productos</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="panel-tabs">
          <button 
            className={`tab ${activeTab === 'horarios' ? 'active' : ''}`}
            onClick={() => setActiveTab('horarios')}
          >
            <Clock size={20} />
            Horarios
          </button>
          <button 
            className={`tab ${activeTab === 'franjas' ? 'active' : ''}`}
            onClick={() => navigate('/merchant-slots')}
          >
            <Clock size={20} />
            Franjas Horarias
          </button>
          <button 
            className={`tab ${activeTab === 'productos' ? 'active' : ''}`}
            onClick={() => setActiveTab('productos')}
          >
            <Package size={20} />
            Productos
          </button>
        </div>

        {/* Contenido de Horarios */}
        {activeTab === 'horarios' && (
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

        {/* Contenido de Productos */}
        {activeTab === 'productos' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Gestión de Productos</h2>
            </div>
            <div className="coming-soon">
              <Package size={48} />
              <h3>Próximamente</h3>
              <p>La gestión de productos estará disponible pronto</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantPanel;
