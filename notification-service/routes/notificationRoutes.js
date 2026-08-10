const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/health', (req, res) => res.status(200).json({ status: 'UP', service: 'notification-service' }));
router.get('/', notificationController.getNotifications);
router.get('/user/:userId', notificationController.getUserNotifications);
router.get('/:id', notificationController.getNotificationById);

module.exports = router;
