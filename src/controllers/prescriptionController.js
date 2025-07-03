const prescriptionService = require('../services/prescriptionService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const AESCipher = require('../utils/crypto');

const aes = new AESCipher(process.env.SECRET_KEY);
const createPrescription = async (req, res) => {
  try {
    const { patientId, diagnosis, medication, notes } = req.body;
    const doctorId = req.user.id;
    if (!patientId || !diagnosis || !medication) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const parsedPatientId = parseInt(patientId, 10);
    const parsedDoctorId = parseInt(doctorId, 10);
    if (isNaN(parsedPatientId) || isNaN(parsedDoctorId)) {
      return res.status(400).json({ message: 'Invalid patientId or doctorId: must be numbers' });
    }
    const prescription = await prescriptionService.createPrescription({
      patientId: parsedPatientId,
      diagnosis,
      medication,
      notes,
      doctorId: parsedDoctorId,
    });
    res.status(201).json(prescription);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getPatientPrescriptions = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    if (!patientId) {
      return res.status(400).json({ message: 'Missing patientId' });
    }
    const parsedPatientId = parseInt(patientId, 10);
    if (isNaN(parsedPatientId)) {
      return res.status(400).json({ message: 'Invalid patientId: must be a number' });
    }
    const prescriptions = await prescriptionService.getPatientPrescriptions(parsedPatientId);
    res.status(200).json(prescriptions);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


const updatePrescription = async (req, res) => {
  try {

    const prescriptionId = parseInt(req.params.id);
    const doctorId = req.user.id;
    const { diagnosis, medication, notes } = req.body;
    // Verify prescription exists and belongs to this doctor
    const existing = await prisma.prescription.findFirst({
      where: { 
        id: prescriptionId,
        doctorId: doctorId 
      },
      include: { encryptedData: true }
    });

    if (!existing) {
      return res.status(404).json({
        status: 'error',
        message: 'Prescription not found or not authorized'
      });
    }

    // Encrypt the updated data
    const encryptedDiagnosis = aes.encrypt(diagnosis);
    const encryptedMedication = aes.encrypt(medication);
    const encryptedNotes = notes ? aes.encrypt(notes) : null;

    // Update prescription and its encrypted data
    const updatedPrescription = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        encryptedData: {
          update: {
            diagnosis: encryptedDiagnosis.ciphertext,
            diagnosisIv: encryptedDiagnosis.iv,
            medication: encryptedMedication.ciphertext,
            medicationIv: encryptedMedication.iv,
            notes: encryptedNotes ? encryptedNotes.ciphertext : null,
            notesIv: encryptedNotes ? encryptedNotes.iv : null
          }
        }
      },
      include: {
        patient: {
          select: { name: true, email: true }
        },
        encryptedData: true
      }
    });

    // Decrypt for response (optional)
    const decryptedData = {
      diagnosis: aes.decrypt(updatedPrescription.encryptedData.diagnosis, updatedPrescription.encryptedData.diagnosisIv),
      medication: aes.decrypt(updatedPrescription.encryptedData.medication, updatedPrescription.encryptedData.medicationIv),
      notes: updatedPrescription.encryptedData.notes 
        ? aes.decrypt(updatedPrescription.encryptedData.notes, updatedPrescription.encryptedData.notesIv)
        : null
    };

    return res.status(200).json({
      status: 'success',
      data: {
        ...updatedPrescription,
        decryptedData
      }
    });

  } catch (error) {
    console.error('Error updating prescription:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update prescription'
    });
  }
};

const deletePrescription = async (req, res) => {
  try {
    const prescriptionId = parseInt(req.params.id);
    const doctorId = req.user.id;

    const existing = await prisma.prescription.findFirst({
      where: { 
        id: prescriptionId,
        doctorId: doctorId 
      }
    });

    if (!existing) {
      return res.status(404).json({
        status: 'error',
        message: 'Prescription not found or not authorized'
      });
    }

    // Delete the prescription (Prisma will cascade delete encryptedData)
    await prisma.prescription.delete({
      where: { id: prescriptionId }
    });

    return res.status(200).json({
      status: 'success',
      message: 'Prescription deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting prescription:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete prescription'
    });
  }
};


module.exports = { createPrescription, getPatientPrescriptions , updatePrescription , deletePrescription };