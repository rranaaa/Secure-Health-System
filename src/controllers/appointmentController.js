const appointmentService = require('../services/appointmentService');

const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date } = req.body;
    const patientId = req.user.id;
    if (!doctorId || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const appointment = await appointmentService.bookAppointment({ patientId, doctorId, date });
    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error booking appointment:', error.message);
    res.status(400).json({ message: error.message });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const patientId = req.user.id;
    console.log(`Attempting to cancel appointment ID: ${appointmentId} for patient ID: ${patientId}`);
    const parsedAppointmentId = parseInt(appointmentId, 10);
    if (isNaN(parsedAppointmentId)) {
      return res.status(400).json({ message: 'Invalid appointmentId: must be a number' });
    }
    const result = await appointmentService.cancelAppointment(parsedAppointmentId, patientId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error cancelling appointment:', error.message);
    res.status(400).json({ message: error.message });
  }
};

const getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;
    const appointments = await appointmentService.getPatientAppointments(patientId);
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error.message);
    res.status(400).json({ message: error.message });
  }
};

module.exports = { bookAppointment, cancelAppointment, getPatientAppointments };