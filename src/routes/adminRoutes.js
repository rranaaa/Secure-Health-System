const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/logs/export/:format', async (req, res) => {
  const format = req.params.format;
  if (!['csv', 'log'].includes(format)) {
    return res.status(400).send('Invalid format');
  }

  try {
    const logs = await prisma.log.findMany({
      include: { user: true }
    });

    let content = '';
    if (format === 'csv') {
      content = 'ID,User Email,Action,Timestamp,IP Address,Details\n' +
        logs.map(log =>
          `${log.id},"${log.user.email}",${log.action},${log.timestamp},${log.ipAddress},"${log.details || ''}"`
        ).join('\n');
    } else {
      content = logs.map(log =>
        `[${log.timestamp}] (${log.user.email}) ${log.action} - ${log.details || 'No details'} from IP ${log.ipAddress}`
      ).join('\n');
    }

    const filename = `logs-${Date.now()}.${format}`;
    const filePath = path.join(__dirname, '..', 'exports', filename);

    // Ensure directory exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    fs.writeFileSync(filePath, content);

    res.download(filePath, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).send('Error downloading the file.');
      } else {
        // Delete the file after download to avoid clutter
        fs.unlink(filePath, () => {});
      }
    });

  } catch (err) {
    console.error('Log export error:', err);
    res.status(500).send('Error exporting logs');
  }
});

module.exports = router;


router.get('/users', authMiddleware, roleMiddleware(['ADMIN']), adminController.getUsers);
router.put('/users/role', authMiddleware, roleMiddleware(['ADMIN']), adminController.updateUserRole);
router.put('/users/activate', authMiddleware, roleMiddleware(['ADMIN']), adminController.activateUser);
router.put('/users/deactivate', authMiddleware, roleMiddleware(['ADMIN']), adminController.deactivateUser);
router.get('/logs', authMiddleware, roleMiddleware(['ADMIN']), adminController.getAuditLogs);
router.get('/appointments', authMiddleware, roleMiddleware(['ADMIN']), adminController.getAllAppointments);
router.get('/prescriptions', authMiddleware, roleMiddleware(['ADMIN']), adminController.getAllPrescriptions);


module.exports = router;
