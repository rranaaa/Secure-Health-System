const { PrismaClient } = require('@prisma/client');
const AESCipher = require('../utils/crypto'); 

const prisma = new PrismaClient();
const aes = new AESCipher(process.env.SECRET_KEY);

const showPatientRecords = async ({ doctorId }) => {
  try {
    // Verify doctor exists and has DOCTOR role
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      select: { id: true, role: true },
    });

    if (!doctor || doctor.role !== 'DOCTOR') {
      throw new Error('Invalid or unauthorized doctor ID');
    }

    // Fetch all appointments for the doctor with patient details
    const appointments = await prisma.appointment.findMany({
      where: { doctorId },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Fetch all prescriptions issued by the doctor with patient details
    const prescriptions = await prisma.prescription.findMany({
      where: { doctorId },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        encryptedData: {
          select: {
            diagnosis: true,
            diagnosisIv: true,
            medication: true,
            medicationIv: true,
            notes: true,
            notesIv: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Combine and structure the response with decrypted prescription data
    const patientRecords = {
      doctorId,
      patients: [
        ...new Map(
          [...appointments, ...prescriptions]
            .map(item => item.patient)
            .map(patient => [patient.id, patient])
        ).values(),
      ].map(patient => ({
        patientId: patient.id,
        patientName: patient.name,
        patientEmail: patient.email,
        appointments: appointments
          .filter(appointment => appointment.patientId === patient.id)
          .map(appointment => ({
            id: appointment.id,
            date: appointment.date,
            status: appointment.status,
          })),
        prescriptions: prescriptions
          .filter(prescription => prescription.patientId === patient.id)
          .map(prescription => ({
            id: prescription.id,
            createdAt: prescription.createdAt,
            decryptedData: prescription.encryptedData
              ? {
                  diagnosis: aes.decrypt(
                    prescription.encryptedData.diagnosis,
                    prescription.encryptedData.diagnosisIv
                  ),
                  medication: aes.decrypt(
                    prescription.encryptedData.medication,
                    prescription.encryptedData.medicationIv
                  ),
                  notes: prescription.encryptedData.notes
                    ? aes.decrypt(
                        prescription.encryptedData.notes,
                        prescription.encryptedData.notesIv
                      )
                    : null,
                }
              : null,
          })),
      })),
    };

    return patientRecords;
  } catch (error) {
    console.error('Error fetching patient records:', error);
    throw new Error('Failed to retrieve patient records');
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = { showPatientRecords };