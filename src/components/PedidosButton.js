import React from 'react';
import { useNavigate } from 'react-router-dom';
import { pedidosAPI } from '../services/api';

const PedidosButton = () => {
  const navigate = useNavigate();

  const handleClick = async () => {
    try {
      // Navegar a la página de pedidos activos
      navigate('/pedidos-activos');
    } catch (error) {
      console.error('Error al navegar a pedidos:', error);
    }
  };

  return (
    <button 
      onClick={handleClick} 
      className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
      aria-label="Ver mis pedidos"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-package"
      >
        <path d="M16.5 9.4 7.55 4.24" />
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.29 7 12 12 20.71 7" />
        <line x1="12" x2="12" y1="22" y2="12" />
      </svg>
      <span>Mis Pedidos</span>
    </button>
  );
};

export default PedidosButton;
