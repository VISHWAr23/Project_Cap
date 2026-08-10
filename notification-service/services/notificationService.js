const Notification = require('../models/Notification');

class NotificationService {
  async handleOrderCompletedEvent(eventData) {
    const { eventId, orderId, userId, message } = eventData;

    // Prevent duplicate processing using eventId
    const existingNotification = await Notification.findOne({ eventId });
    if (existingNotification) {
      console.log(`[NotificationService] Duplicate event detected (eventId: ${eventId}). Skipping notification creation.`);
      return existingNotification;
    }

    const notification = await Notification.create({
      eventId,
      orderId,
      userId,
      message: message || `Your order ${orderId} has been confirmed.`,
      type: 'IN_APP',
      status: 'SENT'
    });

    console.log(`[NotificationService] Order confirmation sent to ${userId} (Notification ID: ${notification._id})`);
    return notification;
  }

  async getAllNotifications() {
    return await Notification.find().sort({ createdAt: -1 });
  }

  async getNotificationById(id) {
    return await Notification.findById(id);
  }

  async getUserNotifications(userId) {
    return await Notification.find({ userId }).sort({ createdAt: -1 });
  }
}

module.exports = new NotificationService();
