// Pedidos endpoint for Vercel
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
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
  } else if (req.method === 'POST') {
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
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};