// routes/sessionRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const {
    createSessionWithActivities,
    getSessionsForRecord,
    deleteSession,
    updateSessionWithActivities,
    exportSessionToPdf 
} = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// /api/records/:recordId/sessions
router.route('/')
    .post(createSessionWithActivities)
    .get(getSessionsForRecord);

        // /api/sessions/:sessionId/pdf
router.route('/:sessionId/pdf')
.get(exportSessionToPdf); // <-- Añadir


// /api/sessions/:sessionId
router.route('/:sessionId')
    .put(updateSessionWithActivities)
    .delete(deleteSession);



module.exports = router;