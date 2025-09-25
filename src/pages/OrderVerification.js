import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Package, 
  MapPin, 
  Phone, 
  User, 
  DollarSign,
  Shield,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { decodeQRData, isValidQR, getQRTimeRemaining } from '../utils/qrUtils';
import '../styles/OrderVerification.css';

const OrderVerification = () => {
  const { encodedData } = useParams();
  const navigate = useNavigate();
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (encodedData) {
      try {
        const decoded = decodeQRData(encodedData);
        if (decoded) {
          setQrData(decoded);
          
          // Verificar si el QR es válido
          if (!isValidQR(decoded)) {
            setError('Este código QR ha expirado');
          }
        } else {
          setError('Código QR inválido');
        }
      } catch (err) {
        setError('Error al procesar el código QR');
      }
    } else {
      setError('No se proporcionó código de verificación');
    }
    setLoading(false);
  }, [encodedData]);

  const handleConfirmDelivery = async () => {
    if (!qrData) return;
    
    setConfirming(true);
    
    try {
      // Simular llamada a API para confirmar entrega
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // En una implementación real, aquí iría la llamada al backend:
      // await api.confirmarEntrega({
      //   pedidoId: qrData.pedidoId,
      //   codigoSeguridad: qrData.codigo,
      //   token: qrData.token,
      //   fechaEntrega: new Date().toISOString()
      // });
      
      setConfirmed(true);
      
      // Auto-cerrar después de 5 segundos
      setTimeout(() => {
        window.close();
      }, 5000);
      
    } catch (err) {
      setError('Error al confirmar la entrega');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="verification-page">
        <div className="verification-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <h2>Verificando código QR...</h2>
            <p>Por favor espera un momento</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="verification-page">
        <div className="verification-container">
          <div className="error-state">
            <AlertCircle size={64} className="error-icon" />
            <h2>Error de Verificación</h2>
            <p>{error}</p>
            <button 
              className="btn btn-secondary"
              onClick={() => window.close()}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="verification-page">
        <div className="verification-container">
          <div className="success-state">
            <div className="success-animation">
              <CheckCircle size={80} className="success-icon" />
              <div className="success-ring"></div>
            </div>
            <h2>¡Entrega Confirmada!</h2>
            <p>El pedido ha sido entregado exitosamente</p>
            <div className="success-details">
              <div className="detail-item">
                <Package size={16} />
                <span>Pedido #{qrData.pedidoId}</span>
              </div>
              <div className="detail-item">
                <Clock size={16} />
                <span>{new Date().toLocaleString('es-CO')}</span>
              </div>
            </div>
            <p className="auto-close-text">
              Esta ventana se cerrará automáticamente en 5 segundos
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-page">
      <div className="verification-container">
        {/* Header */}
        <div className="verification-header">
          <div className="header-content">
            <div className="brand-section">
              <h1>🛒 TuGood TuGo</h1>
              <p>Verificación de Pedido</p>
            </div>
            <div className="status-badge valid">
              <Shield size={16} />
              <span>Pedido Verificado</span>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="order-details">
          <div className="order-header">
            <h2>Detalles del Pedido</h2>
            <div className="order-id">#{qrData.pedidoId}</div>
          </div>

          <div className="details-grid">
            {/* Cliente */}
            <div className="detail-card">
              <div className="detail-icon">
                <User size={20} />
              </div>
              <div className="detail-content">
                <h3>Cliente</h3>
                <p>{qrData.cliente}</p>
              </div>
            </div>

            {/* Comercio */}
            <div className="detail-card">
              <div className="detail-icon">
                <Package size={20} />
              </div>
              <div className="detail-content">
                <h3>Comercio</h3>
                <p>{qrData.comercio}</p>
              </div>
            </div>

            {/* Total */}
            <div className="detail-card">
              <div className="detail-icon">
                <DollarSign size={20} />
              </div>
              <div className="detail-content">
                <h3>Total</h3>
                <p>${qrData.total.toLocaleString()} COP</p>
              </div>
            </div>

            {/* Items */}
            <div className="detail-card">
              <div className="detail-icon">
                <Package size={20} />
              </div>
              <div className="detail-content">
                <h3>Artículos</h3>
                <p>{qrData.items} paquete{qrData.items > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {/* Security Code */}
          <div className="security-section">
            <div className="security-header">
              <Shield size={20} />
              <h3>Código de Seguridad</h3>
            </div>
            <div className="security-code">
              {qrData.codigo}
            </div>
            <p className="security-note">
              Verifica que este código coincida con el mostrado por el cliente
            </p>
          </div>

          {/* Contact Info */}
          <div className="contact-info">
            <div className="contact-item">
              <MapPin size={16} />
              <span>{qrData.direccion}</span>
            </div>
            <div className="contact-item">
              <Phone size={16} />
              <span>{qrData.telefono}</span>
            </div>
          </div>

          {/* Validity */}
          <div className="validity-info">
            <Clock size={16} />
            <span>Válido por: {getQRTimeRemaining(qrData)}</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="instructions">
          <h3>📋 Instrucciones de Entrega</h3>
          <ol>
            <li>Verifica que el código de seguridad coincida</li>
            <li>Confirma la identidad del cliente</li>
            <li>Entrega el pedido al cliente</li>
            <li>Haz clic en "Confirmar Entrega" abajo</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="verification-actions">
          <button 
            className="btn btn-primary btn-large"
            onClick={handleConfirmDelivery}
            disabled={confirming}
          >
            {confirming ? (
              <>
                <div className="btn-spinner"></div>
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Confirmar Entrega
              </>
            )}
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={() => window.close()}
          >
            Cancelar
          </button>
        </div>

        {/* Footer */}
        <div className="verification-footer">
          <p>
            <ExternalLink size={14} />
            Powered by TuGood TuGo - Sistema de Verificación Segura
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderVerification;
