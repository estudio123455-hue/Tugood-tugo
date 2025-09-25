import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, CheckCircle, Package } from 'lucide-react';
import { pedidosAPI } from '../services/api';
import '../styles/MyOrders.css';

const MyOrders = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');
  const [activeOrders, setActiveOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load orders from API
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get user ID from props or localStorage
        const userId = user?.id || localStorage.getItem('userId');
        
        if (!userId) {
          const errorMsg = 'No se encontró el ID de usuario';
          console.warn(errorMsg);
          setError(errorMsg);
          setLoading(false);
          return;
        }
        
        console.log(`Cargando pedidos para usuario: ${userId}`);
        const orders = await pedidosAPI.getAll();
        
        // Log para depuración
        console.log('Respuesta de la API:', { 
          ordersCount: orders.length,
          sampleOrder: orders[0] || 'No hay pedidos'
        });
        
        // Separar pedidos activos e historial
        const active = orders.filter(order => 
          order.estado === 'confirmado' || order.estado === 'listo'
        );
        const completed = orders.filter(order => 
          order.estado === 'completado' || order.estado === 'cancelado'
        );
        
        setActiveOrders(active);
        setOrderHistory(completed);
        
        if (orders.length === 0) {
          console.log('No se encontraron pedidos para el usuario');
        }
      } catch (err) {
        console.error('Error al cargar pedidos:', err);
        setError('No se pudieron cargar los pedidos. Por favor, inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user?.id]); // Add user.id to dependency array

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmado':
        return '#fbbf24';
      case 'listo':
        return '#10b981';
      case 'completado':
        return '#6b7280';
      case 'cancelado':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmado':
        return 'Confirmado';
      case 'listo':
        return 'Listo para recoger';
      case 'completado':
        return 'Completado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmado':
        return <Clock size={16} />;
      case 'listo':
        return <Package size={16} />;
      case 'completado':
        return <CheckCircle size={16} />;
      case 'cancelado':
        return <CheckCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };


  const OrderCard = ({ order }) => (
    <div className="order-card">
      <div className="order-header">
        <div className="order-info">
          <h3>{order.comercio_nombre}</h3>
          <p>{order.pack_titulo}</p>
        </div>
        <div className="order-status" style={{ color: getStatusColor(order.estado) }}>
          {getStatusIcon(order.estado)}
          <span>{getStatusText(order.estado)}</span>
        </div>
      </div>

      <div className="order-details">
        <div className="detail-row">
          <Clock size={16} />
          <span>Recogida: {order.hora_recogida_inicio} - {order.hora_recogida_fin}</span>
        </div>
        <div className="detail-row">
          <MapPin size={16} />
          <span>{order.comercio_direccion}</span>
        </div>
        <div className="detail-row">
          <span className="order-id">Pedido #{order.id}</span>
        </div>
      </div>

      <div className="order-footer">
        <div className="order-total">
          <span>Total: ${order.total.toLocaleString()} COP</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="orders-screen">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-screen">
        <div className="container">
          <div className="error-container">
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Reintentar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-screen">
      <div className="container">
        <div className="orders-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Mis Pedidos</h1>
        </div>

        <div className="orders-tabs">
          <button 
            className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Activos ({activeOrders.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Historial ({orderHistory.length})
          </button>
        </div>

        <div className="orders-content">
          {activeTab === 'active' ? (
            <div className="active-orders">
              {activeOrders.length > 0 ? (
                <>
                  <div className="section-header">
                    <h2>Pedidos Activos</h2>
                    <p>Tus pedidos confirmados y listos para recoger</p>
                  </div>
                  {activeOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </>
              ) : (
                <div className="empty-state">
                  <Package size={64} />
                  <h3>No tienes pedidos activos</h3>
                  <p>Cuando hagas una reserva, aparecerá aquí</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/main')}
                  >
                    Explorar ofertas
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="order-history">
              {orderHistory.length > 0 ? (
                <>
                  <div className="section-header">
                    <h2>Historial de Pedidos</h2>
                    <p>Tus pedidos completados</p>
                  </div>
                  {orderHistory.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </>
              ) : (
                <div className="empty-state">
                  <CheckCircle size={64} />
                  <h3>No tienes pedidos completados</h3>
                  <p>Tu historial de pedidos aparecerá aquí</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default MyOrders;
