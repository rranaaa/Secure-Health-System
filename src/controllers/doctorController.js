const { showPatientRecords } = require('../services/doctorService');

const getPatientRecords = async (req, res) => {
  try {
    const doctorId = parseInt(req.user.id, 10);
    const userRole = req.user.role;

    if (userRole !== 'DOCTOR') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Doctor privileges required',
      });
    }

    if (!doctorId || isNaN(doctorId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid doctor ID in authentication token',
      });
    }

    const patientRecords = await showPatientRecords({ doctorId });

    return res.status(200).json({
      status: 'success',
      data: patientRecords,
    });
  } catch (error) {
    console.error('Error in getPatientRecords:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve patient records',
    });
  }
};

module.exports = {
  getPatientRecords,
};