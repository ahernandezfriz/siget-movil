const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Definimos la ruta para el registro de usuarios
// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login); // <-- Añade esta línea

module.exports = router;