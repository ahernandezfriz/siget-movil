// routes/patientRoutes.js
const express = require('express');
const router = express.Router();
const {
    createPatientAndFirstRecord,
    getMyCurrentPatients,
    getPatientHistory,
    updatePatientDetails, 
    deletePatient,
    addAcademicRecord       
} = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .post(createPatientAndFirstRecord)
    .get(getMyCurrentPatients);

router.route('/:id')
    .get(getPatientHistory)     // Obtener
    .put(updatePatientDetails)  // Actualizar
    .delete(deletePatient);     // Eliminar   

// Nueva ruta para añadir un registro a un paciente
router.post('/:id/records', protect, addAcademicRecord);

module.exports = router;