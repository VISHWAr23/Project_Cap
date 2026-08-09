const Notification = require('../models/Notification');

// Get all notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
};

// Get single notification by ID
exports.getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    return res.status(200).json({ success: true, data: notification });
  } catch (error) {
    console.error('Error fetching notification by ID:', error.message);
    return res.status(400).json({ success: false, message: 'Invalid notification ID format' });
  }
};

// Get notifications for a user
exports.getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    console.error('Error fetching user notifications:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching user notifications' });
  }
};
