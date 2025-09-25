import React, { useState } from 'react';
import { Mail, Eye, EyeOff } from 'lucide-react';
import SocialLoginButtons from '../components/SocialLoginButtons';
import '../styles/WelcomeScreen.css';

const WelcomeScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userData = {
        id: Date.now(),
        email: formData.email,
        name: formData.name || formData.email.split('@')[0],
        provider: 'email'
      };
      
      onLogin(userData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider, userData) => {
    onLogin({
      ...userData,
      provider
    });
  };

  return (
    <div className="welcome-screen">
      <div className="container">
        <div className="welcome-header">
          <div className="logo">
            <div className="logo-icon">🍽️</div>
            <h1>TuGood TuGo</h1>
          </div>
          <p className="tagline">Rescata comida, ahorra dinero</p>
        </div>

        <div className="auth-card card">
          <div className="auth-tabs">
            <button 
              className={`tab-btn ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Iniciar Sesión
            </button>
            <button 
              className={`tab-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <input
                  type="text"
                  name="name"
                  placeholder="Nombre completo"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input"
                  required={!isLogin}
                />
              </div>
            )}
            
            <div className="form-group">
              <div className="input-with-icon">
                <Mail className="input-icon" size={20} />
                <input
                  type="email"
                  name="email"
                  placeholder="Correo electrónico"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input input-with-icon-padding"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-with-icon">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Contraseña"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input input-with-icon-padding"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary auth-submit"
              disabled={loading}
            >
              {loading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
            </button>
          </form>

          <div className="divider">
            <span>o continúa con</span>
          </div>

          <SocialLoginButtons onLogin={handleSocialLogin} />
        </div>

        <div className="welcome-footer">
          <p>Al continuar, aceptas nuestros términos y condiciones</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
