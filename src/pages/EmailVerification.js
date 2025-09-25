import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Mail, Shield, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { verifyConfirmationCode, sendRegistrationConfirmation, sendLoginConfirmation } from '../services/emailService';
import '../styles/EmailVerification.css';

const EmailVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos
  const [verified, setVerified] = useState(false);

  // Obtener datos del estado de navegación
  const { email, type, userData } = location.state || {};

  useEffect(() => {
    // Redirigir si no hay datos
    if (!email || !type) {
      navigate('/login');
      return;
    }

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, type, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return; // Solo un dígito
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus al siguiente input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Auto-verificar cuando se complete el código
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace: ir al input anterior
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyCode = async (codeToVerify = null) => {
    const verificationCode = codeToVerify || code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Por favor ingresa el código completo de 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isValid = verifyConfirmationCode(email, verificationCode, type);
      
      if (isValid) {
        setVerified(true);
        
        // Mostrar éxito por 2 segundos antes de redirigir
        setTimeout(() => {
          if (type === 'registration') {
            navigate('/location'); // Ir a selección de ubicación después del registro
          } else {
            navigate('/main'); // Ir a pantalla principal después del login
          }
        }, 2000);
      } else {
        setError('Código incorrecto. Por favor verifica e intenta nuevamente.');
        setCode(['', '', '', '', '', '']);
        // Focus al primer input
        const firstInput = document.getElementById('code-0');
        if (firstInput) firstInput.focus();
      }
    } catch (err) {
      setError('Error verificando el código. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resending || timeLeft > 240) return; // No permitir reenvío muy frecuente
    
    setResending(true);
    setError('');

    try {
      let result;
      if (type === 'registration') {
        result = await sendRegistrationConfirmation(userData);
      } else {
        result = await sendLoginConfirmation(userData);
      }

      if (result && result.success !== false) {
        setTimeLeft(300); // Reiniciar timer
        alert('📧 Nuevo código enviado a tu email');
      } else {
        setError('Error reenviando el código. Intenta más tarde.');
      }
    } catch (err) {
      setError('Error reenviando el código. Intenta más tarde.');
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="email-verification">
        <div className="verification-container">
          <div className="success-state">
            <div className="success-animation">
              <CheckCircle size={80} className="success-icon" />
              <div className="success-ring"></div>
            </div>
            <h2>¡Verificación Exitosa!</h2>
            <p>Tu email ha sido confirmado correctamente</p>
            <div className="success-message">
              {type === 'registration' ? 
                'Bienvenido a TuGood TuGo. Redirigiendo...' : 
                'Inicio de sesión confirmado. Redirigiendo...'
              }
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="email-verification">
      <div className="verification-container">
        {/* Header */}
        <div className="verification-header">
          <button 
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
          </button>
          <h1>Verificación de Email</h1>
        </div>

        {/* Content */}
        <div className="verification-content">
          <div className="email-icon">
            <Mail size={64} />
          </div>

          <h2>Revisa tu email</h2>
          <p className="verification-text">
            Hemos enviado un código de verificación de 6 dígitos a:
          </p>
          <div className="email-display">
            {email}
          </div>

          {/* Code Input */}
          <div className="code-input-section">
            <label>Ingresa el código de verificación:</label>
            <div className="code-inputs">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`code-input ${error ? 'error' : ''}`}
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Timer */}
          <div className="timer-section">
            <div className="timer">
              <Shield size={16} />
              <span>Código válido por: {formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="verification-actions">
            <button
              className="verify-btn"
              onClick={() => handleVerifyCode()}
              disabled={loading || code.some(digit => digit === '')}
            >
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Verificar Código
                </>
              )}
            </button>

            <button
              className="resend-btn"
              onClick={handleResendCode}
              disabled={resending || timeLeft > 240}
            >
              {resending ? (
                <>
                  <div className="btn-spinner"></div>
                  Reenviando...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  {timeLeft > 240 ? 
                    `Reenviar en ${formatTime(timeLeft - 240)}` : 
                    'Reenviar código'
                  }
                </>
              )}
            </button>
          </div>

          {/* Help Text */}
          <div className="help-text">
            <p>
              ¿No recibiste el email? Revisa tu carpeta de spam o correo no deseado.
            </p>
            <p>
              Si sigues teniendo problemas, contacta a soporte@tugoodtugo.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
