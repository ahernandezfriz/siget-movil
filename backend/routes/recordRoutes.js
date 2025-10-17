// routes/recordRoutes.js
const express = require('express');
const router = express.Router();
const { updateAcademicRecord, deleteAcademicRecord, exportRecordToPdf } = require('../controllers/recordController'); // <-- Importar

const { protect } = require('../middleware/authMiddleware');

// Importar las rutas de sesiones
const sessionRouter = require('./sessionRoutes'); // <-- ¿Está esta línea?

router.use(protect);


// Esta es la línea MÁGICA que conecta todo.
// Le dice: "cuando la URL sea /:recordId/sessions, usa el router de sesiones".
router.use('/:recordId/sessions', sessionRouter); // <-- ¿Está esta línea?

// Nueva ruta para el PDF consolidado
router.get('/:id/pdf', protect, exportRecordToPdf);

router.route('/:id')
    .put(updateAcademicRecord)
    .delete(deleteAcademicRecord);

module.exports = router;