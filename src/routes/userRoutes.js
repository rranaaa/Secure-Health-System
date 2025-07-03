const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.get('/doctors', userController.getDoctors);
router.post('/2fa/setup', authMiddleware, userController.setup2FA);
router.post('/2fa/verify', authMiddleware, userController.verify2FA);
router.put('/profile', authMiddleware, userController.updateProfile);
router.put('/password', authMiddleware, userController.changePassword);

module.exports = router;