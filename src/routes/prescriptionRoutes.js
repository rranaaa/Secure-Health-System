const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/:patientId', authMiddleware, prescriptionController.getPatientPrescriptions);
router.post('/', authMiddleware, prescriptionController.createPrescription);
router.put('/:id', authMiddleware, roleMiddleware(['DOCTOR']), prescriptionController.updatePrescription);
router.delete('/:id', authMiddleware, roleMiddleware(['DOCTOR']), prescriptionController.deletePrescription);





module.exports = router;
