const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/', authMiddleware, roleMiddleware(['PATIENT']), appointmentController.bookAppointment);
router.delete('/:appointmentId', authMiddleware, roleMiddleware(['PATIENT']), appointmentController.cancelAppointment);
router.get('/', authMiddleware, roleMiddleware(['PATIENT']), appointmentController.getPatientAppointments);

module.exports = router;