// Packs endpoint for Vercel
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
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
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};