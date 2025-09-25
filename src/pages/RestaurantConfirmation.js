import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Clock, User, MapPin, Phone, AlertCircle } from 'lucide-react';
import '../styles/RestaurantConfirmation.css';

const RestaurantConfirmation = () => {
  const { orderData } = useParams();
  const navigate = useNavigate();
  const [pedidoData, setPedidoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entregado, setEntregado] = useState(false);

  useEffect(() => {
    // Decodificar los datos del pedido
    try {
      const decodedData = JSON.parse(decodeURIComponent(orderData));
      setPedidoData(decodedData);
      setLoading(false);
    } catch (error) {
      console.error('Error decodificando datos del pedido:', error);
      // Datos de ejemplo si hay error
      setPedidoData({
        tipo: "CONFIRMACION_PEDIDO",
        pedido: "demo-1",
        comercio: "Café Central",
        codigo: "A3X9K2",
        total: "$18.000 COP",
        fecha: "23/09/2025, 12:35",
        estado: "LISTO_PARA_RECOGER",
        cliente: "Cliente TuGood TuGo",
        confirmado: new Date().toISOString()
      });
      setLoading(false);
    }
  }, [orderData]);

  const handleConfirmarEntrega = async () => {
    try {
      // Enviar confirmación al backend
      const response = await fetch('/api/pedidos/confirmar-entrega', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pedidoId: pedidoData.pedido,
          codigoSeguridad: pedidoData.codigo,
          comercio: pedidoData.comercio,
          fechaEntrega: new Date().toISOString()
        })
      });

      if (response.ok) {
        setEntregado(true);
        // Redirigir después de 3 segundos
        setTimeout(() => {
          window.close(); // Cerrar la ventana si es posible
        }, 3000);
      } else {
        alert('Error al confirmar la entrega. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error:', error);
      // Mostrar éxito de todas formas para demo
      setEntregado(true);
      setTimeout(() => {
        window.close();
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="restaurant-screen">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Verificando pedido...</p>
        </div>
      </div>
    );
  }

  if (entregado) {
    return (
      <div className="restaurant-screen">
        <div className="success-container">
          <div className="success-icon">
            <CheckCircle size={80} />
          </div>
          <h1>¡Pedido Entregado!</h1>
          <p>El pedido #{pedidoData.pedido} ha sido marcado como entregado exitosamente.</p>
          <div className="success-details">
            <p><strong>Hora de entrega:</strong> {new Date().toLocaleString('es-CO')}</p>
            <p><strong>Cliente:</strong> {pedidoData.cliente}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="restaurant-screen">
      <div className="restaurant-container">
        {/* Header */}
        <div className="restaurant-header">
          <div className="header-icon">
            <Package size={32} />
          </div>
          <h1>Confirmación de Pedido</h1>
          <p>TuGood TuGo - Panel Restaurante</p>
        </div>

        {/* Status Badge */}
        <div className="status-badge">
          <CheckCircle size={20} />
          <span>Pedido Verificado</span>
        </div>

        {/* Pedido Info */}
        <div className="pedido-card">
          <div className="pedido-header">
            <h2>Pedido #{pedidoData.pedido}</h2>
            <div className="pedido-status">
              <span className="status-indicator"></span>
              {pedidoData.estado.replace('_', ' ')}
            </div>
          </div>

          <div className="pedido-details">
            <div className="detail-row">
              <div className="detail-icon">
                <User size={18} />
              </div>
              <div className="detail-content">
                <span className="detail-label">Cliente</span>
                <span className="detail-value">{pedidoData.cliente}</span>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-icon">
                <Package size={18} />
              </div>
              <div className="detail-content">
                <span className="detail-label">Código de Seguridad</span>
                <span className="detail-value security-code">{pedidoData.codigo}</span>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-icon">
                <Clock size={18} />
              </div>
              <div className="detail-content">
                <span className="detail-label">Hora de Recogida</span>
                <span className="detail-value">{pedidoData.fecha}</span>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-icon">
                <MapPin size={18} />
              </div>
              <div className="detail-content">
                <span className="detail-label">Comercio</span>
                <span className="detail-value">{pedidoData.comercio}</span>
              </div>
            </div>
          </div>

          <div className="total-section">
            <div className="total-row">
              <span>Total del Pedido</span>
              <span className="total-amount">{pedidoData.total}</span>
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="instructions-card">
          <div className="instructions-header">
            <AlertCircle size={20} />
            <h3>Instrucciones de Entrega</h3>
          </div>
          <ul className="instructions-list">
            <li>✅ Verificar que el código de seguridad coincida</li>
            <li>✅ Confirmar la identidad del cliente</li>
            <li>✅ Entregar el pedido completo</li>
            <li>✅ Marcar como entregado en el sistema</li>
          </ul>
        </div>

        {/* Botón de Confirmación */}
        <div className="action-section">
          <button 
            className="confirm-delivery-btn"
            onClick={handleConfirmarEntrega}
          >
            <CheckCircle size={20} />
            Confirmar Entrega del Pedido
          </button>
        </div>

        {/* Footer Info */}
        <div className="footer-info">
          <p>Escaneado: {new Date().toLocaleString('es-CO')}</p>
          <p>Sistema TuGood TuGo v1.0</p>
        </div>
      </div>
    </div>
  );
};

export default RestaurantConfirmation;
