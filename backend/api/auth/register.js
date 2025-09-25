// Register endpoint for Vercel
module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    // Simulación de registro exitoso
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: 'demo-user-' + Date.now(),
        nombre: req.body.nombre || 'Usuario Demo',
        email: req.body.email || 'demo@tugoodtugo.com',
        tipo: req.body.tipo || 'cliente'
      },
      token: 'demo-token-' + Date.now()
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
