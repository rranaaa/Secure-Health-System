const authService = require('../services/authService');

const signup = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const result = await authService.signup({ email, password, name });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, twoFAToken } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const result = await authService.login({ email, password, twoFAToken });
    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const enable2FA = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await authService.enable2FA(userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const verify2FA = async (req, res, next) => {
  try {
    const { twoFAToken } = req.body;
    const userId = req.user.id;
    if (!twoFAToken) {
      return res.status(400).json({ message: '2FA token required' });
    }
    const result = await authService.verify2FA(userId, twoFAToken);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const check2FA = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const result = await authService.check2FA(email);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { signup, login, enable2FA, verify2FA, check2FA };
