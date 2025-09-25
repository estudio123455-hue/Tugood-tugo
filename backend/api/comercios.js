// Comercios endpoint for Vercel
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
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
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};