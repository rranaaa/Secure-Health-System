const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get(
  '/patient-records',
  authMiddleware,
  roleMiddleware(['DOCTOR']), 
  doctorController.getPatientRecords
);

module.exports = router;