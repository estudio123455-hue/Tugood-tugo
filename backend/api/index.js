// Vercel serverless function - Backend completo
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'TuGood TuGo Backend is running on Vercel',
    timestamp: new Date().toISOString(),
    environment: 'production'
  });
});

// Auth endpoints
app.post('/api/auth/register', (req, res) => {
  const { nombre, telefono, email, password, tipo } = req.body;
  
  // Simulación de registro exitoso
  res.status(201).json({
    success: true,
    message: 'Usuario registrado exitosamente',
    user: {
      id: 'user_' + Date.now(),
      nombre: nombre || 'Usuario Demo',
      email: email || 'demo@tugoodtugo.com',
      telefono: telefono || '300-000-0000',
      tipo: tipo || 'cliente',
      ciudad: 'Bogotá'
    },
    token: 'jwt_token_' + Date.now()
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simulación de login exitoso
  res.status(200).json({
    success: true,
    message: 'Login exitoso',
    user: {
      id: 'user_demo',
      nombre: 'Usuario Demo',
      email: email,
      telefono: '300-000-0000',
      tipo: 'cliente',
      ciudad: 'Bogotá'
    },
    token: 'jwt_token_demo'
  });
});

// Comercios endpoints
app.get('/api/comercios', (req, res) => {
  const comerciosDemo = [
    {
      id: 1,
      nombre: 'Panadería El Buen Pan',
      descripcion: 'Panadería artesanal con productos frescos',
      direccion: 'Carrera 15 #93-47, Chapinero',
      telefono: '+57 301 234 5678',
      tipo_comida: 'Panadería',
      zona: 'Chapinero',
      calificacion: 4.5,
      tiempo_entrega: '15-30 min',
      costo_envio: 3000,
      imagen: '/images/panaderia.jpg',
      coordenadas: { lat: 4.6533, lng: -74.0621 },
      horario: '6:00 AM - 8:00 PM',
      activo: true
    },
    {
      id: 2,
      nombre: 'Restaurante Sabor Casero',
      descripcion: 'Comida casera colombiana tradicional',
      direccion: 'Calle 85 #15-20, Usaquén',
      telefono: '+57 302 345 6789',
      tipo_comida: 'Comida Casera',
      zona: 'Usaquén',
      calificacion: 4.3,
      tiempo_entrega: '20-35 min',
      costo_envio: 4000,
      imagen: '/images/casero.jpg',
      coordenadas: { lat: 4.6796, lng: -74.0593 },
      horario: '11:00 AM - 9:00 PM',
      activo: true
    }
  ];
  
  res.status(200).json({
    success: true,
    comercios: comerciosDemo,
    total: comerciosDemo.length
  });
});

// Packs endpoints
app.get('/api/packs', (req, res) => {
  const packsDemo = [
    {
      id: 1,
      comercio_id: 1,
      nombre: 'Pack Desayuno Completo',
      descripcion: 'Pan, croissant, jugo y café',
      precio_original: 15000,
      precio_oferta: 8000,
      cantidad_disponible: 5,
      fecha_vencimiento: new Date(Date.now() + 24*60*60*1000).toISOString(),
      imagen: '/images/pack-desayuno.jpg',
      activo: true
    },
    {
      id: 2,
      comercio_id: 2,
      nombre: 'Almuerzo Ejecutivo',
      descripcion: 'Sopa, seco, arroz, ensalada y jugo',
      precio_original: 25000,
      precio_oferta: 15000,
      cantidad_disponible: 8,
      fecha_vencimiento: new Date(Date.now() + 12*60*60*1000).toISOString(),
      imagen: '/images/almuerzo.jpg',
      activo: true
    }
  ];
  
  res.status(200).json({
    success: true,
    packs: packsDemo,
    total: packsDemo.length
  });
});

// Pedidos endpoints
app.get('/api/pedidos', (req, res) => {
  const pedidosDemo = [
    {
      id: 'pedido_demo_1',
      usuario_id: 'user_demo',
      comercio_id: 1,
      comercio_nombre: 'Panadería El Buen Pan',
      comercio_direccion: 'Carrera 15 #93-47, Chapinero',
      comercio_telefono: '+57 301 234 5678',
      items: [
        {
          pack_id: 1,
          nombre: 'Pack Desayuno Completo',
          cantidad: 1,
          precio: 8000
        }
      ],
      total: 8000,
      estado: 'confirmado',
      fecha_pedido: new Date().toISOString(),
      fecha_recogida: new Date(Date.now() + 2*60*60*1000).toISOString(),
      codigo_seguridad: 'A3X9K2',
      metodo_pago: 'efectivo'
    }
  ];
  
  res.status(200).json({
    success: true,
    pedidos: pedidosDemo,
    total: pedidosDemo.length
  });
});

app.post('/api/pedidos', (req, res) => {
  const nuevoPedido = {
    id: 'pedido_' + Date.now(),
    usuario_id: 'user_demo',
    ...req.body,
    estado: 'confirmado',
    fecha_pedido: new Date().toISOString(),
    codigo_seguridad: Math.random().toString(36).substring(2, 8).toUpperCase()
  };
  
  res.status(201).json({
    success: true,
    message: 'Pedido creado exitosamente',
    pedido: nuevoPedido
  });
});

// Catch all para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path: req.originalUrl
  });
});

module.exports = app;
