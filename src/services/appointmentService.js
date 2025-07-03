const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const bookAppointment = async ({ patientId, doctorId, date }) => {
  try {
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        date: new Date(date),
        status: 'Pending',
      },
    });

    // Log the assignment action
    await prisma.log.create({
      data: {
        userId: doctorId,          // Or you can use patientId or both (depends on your context)
        action: 'ASSIGN_PATIENT',
        ipAddress: '0.0.0.0',      // Replace with real IP if available, e.g., from request object
        details: `Patient ${patientId} assigned to Doctor ${doctorId} with appointment ID ${appointment.id} on ${appointment.date}`,
      },
    });
    return appointment;
  } catch (error) {
    console.error('Error in bookAppointment:', error.message);
    throw new Error('Failed to book appointment');
  } finally {
    await prisma.$disconnect();
  }
};

const cancelAppointment = async (appointmentId, patientId) => {
  try {
    console.log(`Fetching appointment ID: ${appointmentId} for patient ID: ${patientId}`);
    const parsedAppointmentId = parseInt(appointmentId, 10);
    if (isNaN(parsedAppointmentId)) {
      throw new Error('Invalid appointmentId: must be a number');
    }
    const appointment = await prisma.appointment.findUnique({
      where: { id: parsedAppointmentId },
    });
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    if (appointment.patientId !== patientId) {
      console.log(`Authorization failed: patientId ${patientId} does not match appointment patientId ${appointment.patientId}`);
      throw new Error('Unauthorized: You can only cancel your own appointments');
    }
    await prisma.appointment.update({
      where: { id: parsedAppointmentId },
      data: { status: 'Cancelled' },
    });
    await prisma.log.create({
      data: {
        userId: patientId,
        action: 'CANCEL_APPOINTMENT',
        ipAddress: '0.0.0.0',
        details: `Appointment ${parsedAppointmentId} cancelled by patient ${patientId}`,
      },
    });
    return { message: 'Appointment cancelled successfully' };
  } catch (error) {
    console.error('Error in cancelAppointment:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

const getPatientAppointments = async (patientId) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      include: { doctor: { select: { name: true } } },
    });
    return appointments;
  } catch (error) {
    console.error('Error in getPatientAppointments:', error.message);
    throw new Error('Failed to fetch appointments');
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = { bookAppointment, cancelAppointment, getPatientAppointments };
