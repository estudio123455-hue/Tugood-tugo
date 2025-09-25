import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, MapPin, Clock, CreditCard } from 'lucide-react';
import { pedidosAPI, pagosAPI, authAPI } from '../services/api';
import '../styles/Cart.css';

const Cart = ({ user, onOrderComplete }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('tarjeta');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderData, setOrderData] = useState(null);

  // Obtener usuario actual (prop o desde authAPI)
  const currentUser = user || authAPI.getCurrentUser();

  // Validación del usuario
  if (!currentUser || !authAPI.isAuthenticated()) {
    return (
      <div className="cart-screen">
        <div className="container">
          <div className="error-content">
            <h2>Error de autenticación</h2>
            <p>Por favor inicia sesión para continuar.</p>
            <button onClick={() => navigate('/login')} className="btn-primary">
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calcular totales
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 8000) * item.quantity, 0);
  const serviceFee = Math.round(subtotal * 0.1); // 10% tarifa de servicio
  const total = subtotal + serviceFee;

  // Load cart from localStorage and payment methods
  useEffect(() => {
    const loadCartAndPaymentMethods = async () => {
      // Load cart from localStorage
      const cart = JSON.parse(localStorage.getItem('tugood_cart') || '[]');
      setCartItems(cart);

      // Load payment methods from API
      try {
        const methods = await pagosAPI.getPaymentMethods();
        setPaymentMethods(methods.metodos);
      } catch (err) {
        console.error('Error loading payment methods:', err);
      }
    };

    loadCartAndPaymentMethods();
  }, []);

  // Variables de cálculo ya definidas arriba

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity === 0) {
      removeItem(id);
      return;
    }
    
    const updatedItems = cartItems.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedItems);
    localStorage.setItem('tugood_cart', JSON.stringify(updatedItems));
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      alert('Por favor selecciona un método de pago');
      return;
    }
    
    if (!currentUser || !currentUser.id) {
      alert('Error: Usuario no autenticado. Por favor inicia sesión nuevamente.');
      return;
    }
    
    setLoading(true);
    
    try {
      
      // Generate order data
      const newOrderData = {
        usuario_id: currentUser.id,
        comercio_id: cartItems[0].businessId || 1,
        comercio_nombre: cartItems[0].businessName || 'Comercio Demo',
        comercio_direccion: cartItems[0].address || 'Dirección demo',
        comercio_telefono: '+57 300 000 0000',
        items: cartItems.map(item => ({
          pack_id: item.id || 0,
          nombre: item.name || 'Producto',
          cantidad: item.quantity || 1,
          precio: item.price || 0
        })),
        total: total,
        metodo_pago: paymentMethod,
        fecha_recogida: cartItems[0].pickupTime || new Date(Date.now() + 2*60*60*1000).toISOString()
      };
      
      // Crear pedido en la API
      const result = await pedidosAPI.create(newOrderData);
      
      setOrderData(result.pedido);
      setOrderComplete(true);
      
      // Limpiar carrito
      localStorage.removeItem('tugood_cart');
      setCartItems([]);
      
      if (onOrderComplete) {
        onOrderComplete(result.pedido);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Error procesando el pago. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (orderComplete && orderData) {
    return (
      <div className="cart-screen">
        <div className="container">
          <div className="success-content">
            <div className="success-icon">✅</div>
            <h1>¡Reserva Confirmada!</h1>
            <p>Tu pedido ha sido procesado exitosamente</p>
            
            <div className="order-section">
              <h3>Código de pedido</h3>
              <div className="order-code">
                <CreditCard size={120} />
                <p className="order-id">#{orderData.orderId}</p>
              </div>
              <p className="order-instructions">
                Muestra este código al comercio para recoger tu pedido
              </p>
            </div>
            
            <div className="pickup-info">
              <h4>Información de recogida</h4>
              <p><strong>Horario:</strong> {orderData.pickupTime}</p>
              <p><strong>Dirección:</strong> {orderData.businessAddress}</p>
            </div>
            
            <div className="success-actions">
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/pedidos-activos')}
              >
                Ver mis pedidos
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/main')}
              >
                Seguir explorando
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-screen">
      <div className="container">
        <div className="cart-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Carrito</h1>
        </div>

        <div className="cart-content">
          {/* Order Summary */}
          <div className="order-summary">
            <h2>Resumen del pedido</h2>
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <img 
                    src={`https://picsum.photos/80/80?random=${item.id}`} 
                    alt={item.name}
                    className="item-image"
                    onError={(e) => {
                      e.target.src = 'https://picsum.photos/80/80?random=999';
                    }}
                    loading="lazy"
                  />
                  <div className="item-text">
                    <h3>{item.businessName}</h3>
                    <p>{item.name}</p>
                    <div className="item-details">
                      <span className="pickup-time">Recogida: {item.pickupTime}</span>
                      <span className="address">{item.address}</span>
                    </div>
                  </div>
                </div>
                <div className="item-pricing">
                  <span className="original-price">${item.originalPrice?.toLocaleString() || '15,000'} COP</span>
                  <span className="discounted-price">${item.price?.toLocaleString() || '8,000'} COP</span>
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      <Minus size={16} />
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus size={16} />
                    </button>
                  </div>
                  <button 
                    className="remove-item"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Method Selection */}
          {cartItems.length > 0 && (
            <div className="payment-section">
              <h3>Método de Pago</h3>
              <div className="payment-methods">
                {paymentMethods.map(method => (
                  <label key={method.id} className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-info">
                      <span className="payment-name">{method.nombre}</span>
                      <span className="payment-desc">{method.descripcion}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Checkout Button */}
          <div className="checkout-section">
            <div className="total-summary">
              <div className="total-row">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString()} COP</span>
              </div>
              <div className="total-row">
                <span>Tarifa de servicio (10%)</span>
                <span>${serviceFee.toLocaleString()} COP</span>
              </div>
              <div className="total-row final">
                <span><strong>Total</strong></span>
                <span><strong>${total.toLocaleString()} COP</strong></span>
              </div>
            </div>
            
            <button 
              className="checkout-button"
              onClick={handlePayment}
              disabled={cartItems.length === 0 || loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner small"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  Pagar ${(total * 4000).toLocaleString()} COP
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
