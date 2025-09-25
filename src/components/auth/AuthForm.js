import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import OTPVerification from './OTPVerification';

const AuthForm = ({ isLogin = true }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Por favor ingresa tu correo electrónico');
      return;
    }
    
    if (!isLogin && !name) {
      toast.error('Por favor ingresa tu nombre');
      return;
    }
    
    if (!isLogin && !password) {
      toast.error('Por favor ingresa una contraseña');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Primero, solicitar el código OTP
      const response = await fetch('http://localhost:5000/api/otp/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Código de verificación enviado a tu correo');
        setShowOtpVerification(true);
      } else {
        toast.error(data.message || 'Error al enviar el código de verificación');
      }
    } catch (error) {
      console.error('Error al enviar el código de verificación:', error);
      toast.error('Error de conexión. Intenta de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOtpSuccess = (token) => {
    // Guardar el token en localStorage o en el estado global de la aplicación
    localStorage.setItem('token', token);
    
    // Redirigir al dashboard o a la página principal
    navigate('/dashboard');
  };
  
  const handleBackToForm = () => {
    setShowOtpVerification(false);
  };

  if (showOtpVerification) {
    return (
      <OTPVerification 
        email={email} 
        onBack={handleBackToForm}
        onSuccess={handleOtpSuccess}
      />
    );
  }

  return (
    <Container>
      <FormContainer>
        <Title>{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</Title>
        <Description>
          {isLogin 
            ? 'Ingresa tus credenciales para acceder a tu cuenta.'
            : 'Crea una cuenta para comenzar a usar TuGood TuGo.'
          }
        </Description>
        
        <Form onSubmit={handleSubmit}>
          {!isLogin && (
            <InputGroup>
              <Input
                type="text"
                placeholder="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </InputGroup>
          )}
          
          <InputGroup>
            <Input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </InputGroup>
          
          {!isLogin && (
            <InputGroup>
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </InputGroup>
          )}
          
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Procesando...
              </>
            ) : isLogin ? (
              'Iniciar sesión'
            ) : (
              'Registrarse'
            )}
          </Button>
        </Form>
        
        <Footer>
          {isLogin ? (
            <>
              ¿No tienes una cuenta?{' '}
              <LinkButton onClick={() => navigate('/register')}>
                Regístrate
              </LinkButton>
            </>
          ) : (
            <>
              ¿Ya tienes una cuenta?{' '}
              <LinkButton onClick={() => navigate('/login')}>
                Inicia sesión
              </LinkButton>
            </>
          )}
        </Footer>
      </FormContainer>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F9FAFB;
  padding: 2rem;
`;

const FormContainer = styled.div`
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 2.5rem;
  width: 100%;
  max-width: 28rem;
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
  text-align: center;
`;

const Description = styled.p`
  color: #6B7280;
  text-align: center;
  margin-bottom: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const InputGroup = styled.div`
  position: relative;
`;

const InputIcon = styled.span`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9CA3AF;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border: 1px solid #D1D5DB;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    outline: none;
    border-color: #4F46E5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
  }
  
  &:disabled {
    background-color: #F3F4F6;
    cursor: not-allowed;
  }
`;

const Button = styled.button`
  background-color: #4F46E5;
  color: white;
  font-weight: 500;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  
  &:hover {
    background-color: #4338CA;
  }
  
  &:disabled {
    background-color: #A5B4FC;
    cursor: not-allowed;
  }
`;

const Footer = styled.div`
  margin-top: 1.5rem;
  text-align: center;
  color: #6B7280;
  font-size: 0.875rem;
`;

const LinkButton = styled.button`
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
`;

export default AuthForm;
