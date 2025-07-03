const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/2fa/enable', authMiddleware, authController.enable2FA);
router.post('/2fa/verify', authMiddleware, authController.verify2FA);
router.get('/check-2fa', authController.check2FA);

module.exports = router;