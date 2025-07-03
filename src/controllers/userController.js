const userService = require('../services/userService');

const signup = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    console.log('Signup request body:', { email, password, name, role });

    if (!name) return res.status(400).json({ message: 'Full name is required' });
    if (!email) return res.status(400).json({ message: 'Email is required' });
    if (!password) return res.status(400).json({ message: 'Password is required' });

    const assignedRole = role || 'PATIENT'; // Default to PATIENT
    if (!['PATIENT', 'DOCTOR', 'ADMIN'].includes(assignedRole)) {
      return res.status(400).json({ message: 'Invalid role. Must be PATIENT, DOCTOR, or ADMIN' });
    }
    const { user, token } = await userService.signup({ email, password, name, role: assignedRole });
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Signup error:', error.message);
    if (error.message.includes('Unique constraint failed on the fields: (`email`)')) {
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(400).json({ message: error.message || 'Failed to signup' });
    }
  }
};

const login = async (req, res) => {
  try {
    const { email, password, twoFAToken } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const { user, token } = await userService.login({ email, password, twoFAToken });
    res.status(200).json({ user, token });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

const setup2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { secret, qrCode } = await userService.setup2FA(userId);
    res.status(200).json({ secret, qrCode });
  } catch (error) {
    console.error('2FA setup error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

const verify2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Missing 2FA token' });
    }
    const result = await userService.verify2FA(userId, token);
    res.status(200).json(result);
  } catch (error) {
    console.error('2FA verify error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Missing name' });
    }
    const user = await userService.updateProfile(userId, { name });
    res.status(200).json(user);
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    await userService.changePassword(userId, { currentPassword, newPassword });
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

const getDoctors = async (req, res) => {
  try {
    const doctors = await userService.getDoctors();
    res.status(200).json(doctors);
  } catch (error) {
    console.error('Get doctors error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

module.exports = { signup, login, setup2FA, verify2FA, updateProfile, changePassword, getDoctors };