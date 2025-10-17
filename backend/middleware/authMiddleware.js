const jwt = require('jsonwebtoken');
const pool = require('../db');

const protect = async (req, res, next) => {
  let token;

  // 1. Verificar si la petición tiene la cabecera 'Authorization' y empieza con 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. Extraer el token de la cabecera (formato: "Bearer TOKEN")
      token = req.headers.authorization.split(' ')[1];

      // 3. Verificar el token usando nuestro secreto
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Obtener los datos del usuario desde el payload del token y adjuntarlos al objeto 'req'
      // Esto hará que los datos del usuario estén disponibles en cualquier ruta protegida.
      // Excluimos la contraseña por seguridad.
      req.user = await pool.query('SELECT id, nombre_completo, email, especialidad FROM Profesionales WHERE id = $1', [decoded.user.id]);
      req.user = req.user.rows[0];

      // 5. Si todo está bien, pasar a la siguiente función/middleware
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ error: 'No autorizado, token falló.' });
    }
  }

  // Si no hay ningún token en la cabecera
  if (!token) {
    res.status(401).json({ error: 'No autorizado, no hay token.' });
  }
};

module.exports = { protect };