// controllers/professionalController.js

const pool = require('../db');

// @desc    Obtener el perfil del profesional logueado
// @route   GET /api/professionals/profile
// @access  Private
const getProfessionalProfile = async (req, res) => {
    // Gracias a nuestro middleware 'protect', ya tenemos los datos del usuario en 'req.user'
    const userProfile = req.user;
  
    if (userProfile) {
      res.status(200).json(userProfile);
    } else {
      res.status(404).json({ error: 'Usuario no encontrado.' });
    }
  };



// @desc    Actualizar el perfil del profesional logueado
// @route   PUT /api/professionals/profile
// @access  Private
const updateProfessionalProfile = async (req, res) => {
    // 1. El ID del usuario lo obtenemos del token (añadido por el middleware)
    const userId = req.user.id;
  
    // 2. Obtenemos los datos a actualizar del cuerpo de la petición
    const { nombre_completo, email, especialidad } = req.body;
  
    try {
      // 3. Construimos la consulta SQL para actualizar los datos
      // Usamos COALESCE para mantener el valor existente si no se proporciona uno nuevo.
      const updateQuery = `
        UPDATE Profesionales
        SET 
          nombre_completo = COALESCE($1, nombre_completo),
          email = COALESCE($2, email),
          especialidad = COALESCE($3, especialidad)
        WHERE id = $4
        RETURNING id, nombre_completo, email, especialidad;
      `;
  
      const updatedUser = await pool.query(updateQuery, [
        nombre_completo, 
        email, 
        especialidad, 
        userId
      ]);
  
      // 4. Enviamos la respuesta con los datos actualizados
      res.status(200).json(updatedUser.rows[0]);
  
    } catch (err) {
      // Manejamos el caso en que el nuevo email ya esté en uso
      if (err.code === '23505') {
        return res.status(409).json({ error: 'El correo electrónico ya está en uso.' });
      }
  
      console.error("❌ Error al actualizar el perfil:", err);
      res.status(500).json({ error: 'Error interno del servidor.' });
    }
  };
  
  
  module.exports = {
    getProfessionalProfile,
    updateProfessionalProfile,
  };