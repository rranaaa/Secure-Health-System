const adminService = require('../services/adminService');

const activateUser = async (req, res) => {
  try {
    const userId = parseInt(req.body.userId, 10);

    if (userId === 1) {
      return res.status(403).json({ error: 'Cannot activate or deactivate the main admin.' });
    }

    const user = await adminService.toggleUserActiveStatus(userId, true);
    res.json({ message: 'User activated successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deactivateUser = async (req, res) => {
  try {
    const userId = parseInt(req.body.userId, 10);

    if (userId === 1) {
      return res.status(403).json({ error: 'Cannot activate or deactivate the main admin.' });
    }

    const user = await adminService.toggleUserActiveStatus(userId, false);
    res.json({ message: 'User deactivated successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const getUsers = async (req, res) => {
  try {
    const users = await adminService.getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const user = await adminService.updateUserRole(userId, role);
    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const logs = await adminService.getAuditLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllAppointments = async (req, res) => {
  try {
    const appointments = await adminService.getAllAppointments();
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

const getAllPrescriptions = async (req, res) => {
  try {
    const prescriptions = await adminService.getAllPrescriptions();
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
};

module.exports = {
  activateUser,
  deactivateUser,
  getUsers,
  updateUserRole,
  getAuditLogs,
  getAllAppointments,
  getAllPrescriptions,
};
