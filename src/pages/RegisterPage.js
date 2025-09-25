import React from 'react';
import AuthForm from '../components/auth/AuthForm';
import styled from 'styled-components';

const RegisterPage = () => {
  return (
    <PageContainer>
      <AuthForm isLogin={false} />
    </PageContainer>
  );
};

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  padding: 2rem;
`;

export default RegisterPage;
