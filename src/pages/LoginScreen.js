import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin } from 'lucide-react';
import { authAPI } from '../services/api';
import '../styles/LoginScreen.css';

const LoginScreen = ({ onLogin }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    telefono: '',
    tipo: 'cliente' // 'cliente' o 'comercio'
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      
      if (isLogin) {
        console.log('Iniciando sesión con:', formData.email);
        result = await authAPI.login({
          email: formData.email,
          password: formData.password
        });
        console.log('Respuesta de login:', result);
        
        // Verificar que el token se haya guardado correctamente
        const token = localStorage.getItem('tugood_token');
        if (!token) {
          throw new Error('No se pudo obtener el token de autenticación');
        }
        console.log('Token guardado correctamente');
      } else {
        console.log('Registrando nuevo usuario:', formData.email);
        const userData = {
          nombre: formData.nombre,
          telefono: formData.telefono,
          email: formData.email,
          password: formData.password,
          tipo: formData.tipo || 'cliente'
        };
        result = await authAPI.register(userData);
        console.log('Usuario registrado:', result);
      }

      // Verificar si requiere verificación por email
      if (result.requiresVerification) {
        console.log('Redirigiendo a verificación de email');
        navigate('/email-verification', {
          state: {
            email: result.emailResult?.email || formData.email,
            type: result.emailResult?.type || (isLogin ? 'login' : 'registration'),
            userData: result.user
          }
        });
        return;
      }

      // Usar el usuario devuelto por la respuesta directamente
      const currentUser = result.user;
      console.log('Usuario autenticado:', currentUser);
      
      if (!currentUser) {
        throw new Error('No se pudo obtener la información del usuario');
      }

      // Call onLogin with the user data
      if (onLogin) {
        onLogin(currentUser);
      }
    } catch (err) {
      console.error('Login/Register error:', err);
      
      // Handle specific error messages
      if (err.message && err.message.includes("ya está registrado")) {
        setError("Este correo ya está registrado. Prueba con otro o inicia sesión.");
      } else if (err.message && err.message.includes("Credenciales inválidas")) {
        setError("Correo o contraseña incorrectos. Verifica tus datos.");
      } else if (err.message && err.message.includes("Usuario no encontrado")) {
        setError("No existe una cuenta con este correo. ¿Quieres registrarte?");
      } else {
        setError(err.message || 'Error en el proceso de autenticación');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('Función de Google Login próximamente disponible');
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Iniciando sesión demo...');
      const result = await authAPI.login({
        email: 'demo@tugood.com',
        password: 'demo123'
      });
      console.log('Login demo exitoso:', result);
      
      // Verificar que el token se haya guardado
      const token = localStorage.getItem('tugood_token');
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }
      
      // Usar el usuario devuelto por la respuesta del login
      const currentUser = result.user;
      console.log('Usuario demo autenticado:', currentUser);
      
      if (!currentUser) {
        throw new Error('No se pudo obtener la información del usuario demo');
      }
      
      if (onLogin) {
        onLogin(currentUser);
      }
    } catch (err) {
      console.error('Error en login demo:', err);
      setError(err.message || 'Error en el login demo. Intenta iniciar sesión manualmente.');
    } finally {
      setLoading(false);
    }
  };

  const handleComercioDemo = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Iniciando sesión comercio demo...');
      const result = await authAPI.login({
        email: 'panaderia@test.com',
        password: 'test123'
      });
      console.log('Login comercio demo exitoso:', result);
      
      // Verificar que el token se haya guardado
      const token = localStorage.getItem('tugood_token');
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }
      
      // Usar el usuario devuelto por la respuesta del login
      const currentUser = result.user;
      console.log('Usuario comercio demo autenticado:', currentUser);
      
      if (!currentUser) {
        throw new Error('No se pudo obtener la información del usuario comercio demo');
      }
      
      if (onLogin) {
        onLogin(currentUser);
      }
    } catch (err) {
      console.error('Error en login comercio demo:', err);
      setError(err.message || 'Error en el login comercio demo. Intenta iniciar sesión manualmente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        {/* Header */}
        <div className="login-header">
          <div className="logo">
            <h1>TuGood TuGo</h1>
            <p>Rescata comida, ahorra dinero</p>
          </div>
        </div>

        {/* Toggle Login/Register */}
        <div className="auth-toggle">
          <button
            className={`toggle-btn ${isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(true);
              setError('');
              setFormData({ ...formData, nombre: '', telefono: '', tipo: 'cliente' });
            }}
          >
            Iniciar Sesión
          </button>
          <button
            className={`toggle-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
          >
            Registrarse
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              {/* Nombre */}
              <div className="form-group">
                <div className="input-wrapper">
                  <span className="input-icon-emoji">👤</span>
                  <input
                    type="text"
                    name="nombre"
                    placeholder="Nombre completo"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    autoComplete="name"
                    style={{
                      color: '#000000 !important',
                      WebkitTextFillColor: '#000000 !important',
                      backgroundColor: '#ffffff !important'
                    }}
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div className="form-group">
                <div className="input-wrapper">
                  <span className="input-icon-emoji">📱</span>
                  <input
                    type="tel"
                    name="telefono"
                    placeholder="Telefono (ej: 3001234567)"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    required
                    autoComplete="tel"
                    style={{
                      color: '#000000 !important',
                      WebkitTextFillColor: '#000000 !important',
                      backgroundColor: '#ffffff !important'
                    }}
                  />
                </div>
              </div>

              {/* Tipo de cuenta */}
              <div className="form-group">
                <label className="form-label">Tipo de cuenta: (¿Eres cliente o comercio?)</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="tipo"
                      value="cliente"
                      checked={formData.tipo === 'cliente'}
                      onChange={handleInputChange}
                    />
                    <span className="radio-custom"></span>
                    <div className="radio-content">
                      <strong>🛒 Cliente</strong>
                      <small>Comprar packs de comida</small>
                    </div>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="tipo"
                      value="comercio"
                      checked={formData.tipo === 'comercio'}
                      onChange={handleInputChange}
                    />
                    <span className="radio-custom"></span>
                    <div className="radio-content">
                      <strong>🏪 Comercio</strong>
                      <small>Vender excedentes de comida</small>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="form-group">
            <div className="input-wrapper">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                required
                autoComplete="email"
                style={{
                  color: '#000000 !important',
                  WebkitTextFillColor: '#000000 !important',
                  backgroundColor: '#ffffff !important'
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
                style={{
                  color: '#000000 !important',
                  WebkitTextFillColor: '#000000 !important',
                  backgroundColor: '#ffffff !important'
                }}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <span>🙈</span> : <span>👁️</span>}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <div className="loading-spinner small"></div>
            ) : (
              isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
            )}
          </button>

          {/* Google Login */}
          <div className="divider">
            <span>o</span>
          </div>

          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
              width="20"
              height="20"
            />
            Continuar con Google
          </button>

          {/* Comercio Button */}
          <div className="divider">
            <span>o</span>
          </div>

          <button
            type="button"
            className="comercio-btn"
            onClick={handleComercioDemo}
            disabled={loading}
          >
            🏪 Acceder como Comercio
          </button>

          {/* Footer */}
          <div className="auth-footer">
            {isLogin ? (
              <p>
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setIsLogin(false)}
                >
                  Regístrate aquí
                </button>
              </p>
            ) : (
              <p>
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setIsLogin(true)}
                >
                  Inicia sesión
                </button>
              </p>
            )}
          </div>
        </form>

        {/* Demo Accounts */}
        <div className="demo-accounts">
          <h4>Cuentas de prueba:</h4>
          <div className="demo-buttons">
            <button
              className="demo-btn"
              onClick={handleDemoLogin}
            >
              Cliente Demo
            </button>
            <button
              className="demo-btn"
              onClick={handleComercioDemo}
            >
              Comercio Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
