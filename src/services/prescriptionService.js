const { PrismaClient } = require('@prisma/client');
const AESCipher = require('../utils/crypto');

const prisma = new PrismaClient();
const secretKey = process.env.SECRET_KEY;

if (!secretKey) {
  throw new Error('SECRET_KEY is undefined. Check your .env file and dotenv setup.');
}

const aes = new AESCipher(secretKey);

const createPrescription = async ({ patientId, diagnosis, medication, notes, doctorId }) => {
  try {
    if (!patientId || !diagnosis || !medication || !doctorId) {
      throw new Error('Missing required fields');
    }

    const parsedPatientId = parseInt(patientId, 10);
    const parsedDoctorId = parseInt(doctorId, 10);
    if (isNaN(parsedPatientId) || isNaN(parsedDoctorId)) {
      throw new Error('Invalid patientId or doctorId: must be numbers');
    }

    const prescription = await prisma.prescription.create({
      data: {
        patientId: parsedPatientId,
        doctorId: parsedDoctorId,
      },
    });

    const encryptedDiagnosis = aes.encrypt(diagnosis);
    const encryptedMedication = aes.encrypt(medication);
    const encryptedNotes = notes ? aes.encrypt(notes) : null;

    const encryptedData = await prisma.encryptedPrescriptionData.create({
      data: {
        diagnosis: encryptedDiagnosis.encryptedData,
        diagnosisIv: encryptedDiagnosis.iv,
        medication: encryptedMedication.encryptedData,
        medicationIv: encryptedMedication.iv,
        notes: encryptedNotes?.encryptedData || null,
        notesIv: encryptedNotes?.iv || null,
        prescriptionId: prescription.id,
      },
    });

    await prisma.log.create({
      data: {
        userId: parsedDoctorId,
        action: 'CREATE_PRESCRIPTION',
        ipAddress: '0.0.0.0',
        details: `Prescription created for patient ${parsedPatientId}`,
      },
    });

    return {
      id: prescription.id,
      patientId: parsedPatientId,
      doctorId: parsedDoctorId,
      diagnosis,
      medication,
      notes,
      createdAt: prescription.createdAt,
    };
  } catch (error) {
    console.error('Error creating prescription:', error);
    throw new Error(error.message || 'Failed to create prescription');
  } finally {
    await prisma.$disconnect();
  }
};

const getPatientPrescriptions = async (patientId) => {
  try {
    const parsedPatientId = parseInt(patientId, 10);
    if (isNaN(parsedPatientId)) {
      throw new Error('Invalid patientId: must be a number');
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: parsedPatientId },
      include: {
        doctor: { select: { name: true } },
        encryptedData: true,
      },
    });

    return prescriptions.map((p) => {
      if (!p.encryptedData) {
        throw new Error(`No encrypted data for prescription ${p.id}`);
      }
      const ed = p.encryptedData;
      return {
        id: p.id,
        doctorId: p.doctorId,
        patientId: p.patientId,
        doctor: {
          name: p.doctor.name,
        },
        diagnosis: aes.decrypt(ed.diagnosis, ed.diagnosisIv),
        medication: aes.decrypt(ed.medication, ed.medicationIv),
        notes: ed.notes && ed.notesIv ? aes.decrypt(ed.notes, ed.notesIv) : null,
        createdAt: p.createdAt,
      };
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    throw new Error(error.message || 'Failed to fetch prescriptions');
  } finally {
    await prisma.$disconnect();
  }
};

const updatePrescription = async ({ prescriptionId, doctorId, diagnosis, medication, notes }) => {
  try {
    console.log(secretKey);
    const parsedPrescriptionId = parseInt(prescriptionId, 10);
    const parsedDoctorId = parseInt(doctorId, 10);
    if (isNaN(parsedPrescriptionId) || isNaN(parsedDoctorId)) {
      throw new Error('Invalid prescriptionId or doctorId: must be numbers');
    }
    // Verify prescription exists and belongs to this doctor
    const existing = await prisma.prescription.findFirst({
      where: { 
        id: parsedPrescriptionId,
        doctorId: parsedDoctorId 
      },
      include: { encryptedData: true }
    });

    if (!existing) {
      throw new Error('Prescription not found or not authorized');
    }

    // Encrypt the updated data
    const encryptedDiagnosis = aes.encrypt(diagnosis);
    const encryptedMedication = aes.encrypt(medication);
    const encryptedNotes = notes ? aes.encrypt(notes) : null;

    // Update prescription and its encrypted data
    const updatedPrescription = await prisma.prescription.update({
      where: { id: parsedPrescriptionId },
      data: {
        encryptedData: {
          update: {
            diagnosis: encryptedDiagnosis.encryptedData,
            diagnosisIv: encryptedDiagnosis.iv,
            medication: encryptedMedication.encryptedData,
            medicationIv: encryptedMedication.iv,
            notes: encryptedNotes ? encryptedNotes.encryptedData : null,
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

    await prisma.log.create({
      data: {
        userId: parsedDoctorId,
        action: 'UPDATE_PRESCRIPTION',
        ipAddress: '0.0.0.0',
        details: `Prescription ${parsedPrescriptionId} updated for patient ${updatedPrescription.patientId}`,
      },
    });

    return {
      id: updatedPrescription.id,
      patientId: updatedPrescription.patientId,
      doctorId: updatedPrescription.doctorId,
      diagnosis,
      medication,
      notes,
      createdAt: updatedPrescription.createdAt,
      patient: updatedPrescription.patient
    };
  } catch (error) {
    console.error('Error updating prescription:', error);
    throw new Error(error.message || 'Failed to update prescription');
  } finally {
    await prisma.$disconnect();
  }
};

const deletePrescription = async ({ prescriptionId, doctorId }) => {
  try {
    const parsedPrescriptionId = parseInt(prescriptionId, 10);
    const parsedDoctorId = parseInt(doctorId, 10);
    if (isNaN(parsedPrescriptionId) || isNaN(parsedDoctorId)) {
      throw new Error('Invalid prescriptionId or doctorId: must be numbers');
    }

    const existing = await prisma.prescription.findFirst({
      where: { 
        id: parsedPrescriptionId,
        doctorId: parsedDoctorId 
      }
    });

    if (!existing) {
      throw new Error('Prescription not found or not authorized');
    }

    await prisma.prescription.delete({
      where: { id: parsedPrescriptionId }
    });

    await prisma.log.create({
      data: {
        userId: parsedDoctorId,
        action: 'DELETE_PRESCRIPTION',
        ipAddress: '0.0.0.0',
        details: `Prescription ${parsedPrescriptionId} deleted`,
      },
    });

    return { message: 'Prescription deleted successfully' };
  } catch (error) {
    console.error('Error deleting prescription:', error);
    throw new Error(error.message || 'Failed to delete prescription');
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = { createPrescription, getPatientPrescriptions, updatePrescription, deletePrescription };