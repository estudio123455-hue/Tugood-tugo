import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OTPVerification = ({ email, onBack, onSuccess }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();

  // Efecto para el contador de reenvío
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    
    // Auto-focus al siguiente campo
    if (element.nextSibling && element.value !== '') {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
      // Mover al campo anterior al presionar retroceso
      const prevInput = e.target.previousSibling;
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      toast.error('Por favor ingresa el código de 6 dígitos');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: otpCode,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('¡Código verificado con éxito!');
        if (onSuccess) {
          onSuccess(data.token); // Asegúrate de que el backend devuelva un token
        }
      } else {
        toast.error(data.message || 'Error al verificar el código');
      }
    } catch (error) {
      console.error('Error al verificar el código:', error);
      toast.error('Error de conexión. Intenta de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/otp/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('¡Código reenviado con éxito!');
        setCountdown(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        // Enfocar el primer campo del OTP
        document.getElementById('otp-0')?.focus();
      } else {
        toast.error(data.message || 'Error al reenviar el código');
      }
    } catch (error) {
      console.error('Error al reenviar el código:', error);
      toast.error('Error de conexión. Intenta de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <BackButton onClick={onBack}>
        <ArrowLeft size={20} /> Volver
      </BackButton>
      
      <IconContainer>
        <Mail size={48} color="#4F46E5" />
      </IconContainer>
      
      <Title>Verifica tu correo</Title>
      <Description>
        Hemos enviado un código de 6 dígitos a <strong>{email}</strong>.
        Por favor, ingrésalo a continuación para continuar.
      </Description>
      
      <OTPContainer>
        {otp.map((digit, index) => (
          <OTPInput
            key={index}
            id={`otp-${index}`}
            type="text"
            maxLength="1"
            value={digit}
            onChange={(e) => handleOtpChange(e.target, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            autoFocus={index === 0}
            disabled={isLoading}
          />
        ))}
      </OTPContainer>
      
      <Button onClick={handleVerify} disabled={isLoading}>
        {isLoading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          'Verificar código'
        )}
      </Button>
      
      <ResendText>
        ¿No recibiste el código?{' '}
        <ResendButton 
          onClick={handleResendCode} 
          disabled={!canResend || isLoading}
        >
          {canResend ? 'Reenviar código' : `Reenviar en ${countdown}s`}
        </ResendButton>
      </ResendText>
    </Container>
  );
};

const Container = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #6B7280;
  font-size: 0.875rem;
  cursor: pointer;
  margin-bottom: 1.5rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #F3F4F6;
  }
`;

const IconContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.75rem;
`;

const Description = styled.p`
  color: #6B7280;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const OTPContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 0.75rem;
`;

const OTPInput = styled.input`
  width: 3.5rem;
  height: 3.5rem;
  text-align: center;
  font-size: 1.5rem;
  border: 1px solid #D1D5DB;
  border-radius: 0.5rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    border-color: #4F46E5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
  }
  
  &::placeholder {
    color: #9CA3AF;
  }
  
  &:disabled {
    background-color: #F3F4F6;
    cursor: not-allowed;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 0.875rem;
  background-color: #4F46E5;
  color: white;
  font-weight: 500;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    background-color: #4338CA;
  }
  
  &:disabled {
    background-color: #A5B4FC;
    cursor: not-allowed;
  }
`;

const ResendText = styled.p`
  margin-top: 1.5rem;
  color: #6B7280;
  font-size: 0.875rem;
`;

const ResendButton = styled.button`
  background: none;
  border: none;
  color: #4F46E5;
  font-weight: 500;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  
  &:hover {
    text-decoration: underline;
  }
  
  &:disabled {
    color: #9CA3AF;
    cursor: not-allowed;
    text-decoration: none;
  }
`;

export default OTPVerification;
