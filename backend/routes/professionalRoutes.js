// routes/professionalRoutes.js

const express = require('express');
const router = express.Router();
const { getProfessionalProfile, updateProfessionalProfile } = require('../controllers/professionalController');
const { protect } = require('../middleware/authMiddleware'); // <-- Importamos nuestro guardián

// Aplicamos el middleware 'protect' a esta ruta.
// Express ejecutará 'protect' ANTES de ejecutar 'getProfessionalProfile'.
// Agrupamos las rutas que apuntan a '/profile'
router
  .route('/profile')
  .get(protect, getProfessionalProfile)       // Para obtener el perfil
  .put(protect, updateProfessionalProfile);      // Para actualizar el perfil
module.exports = router;