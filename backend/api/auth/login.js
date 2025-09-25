// Login endpoint for Vercel
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    // Simulación de login exitoso
    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      user: {
        id: 'user_demo',
        nombre: 'Usuario Demo',
        email: req.body.email,
        telefono: '300-000-0000',
        tipo: 'cliente',
        ciudad: 'Bogotá'
      },
      token: 'jwt_token_demo'
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};