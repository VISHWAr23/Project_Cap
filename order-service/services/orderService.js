const axios = require('axios');
const Basket = require('../models/Basket');
const Order = require('../models/Order');
const { publishOrderCompletedEvent } = require('../rabbitmq');

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3001';

class OrderService {
  async processCheckout(basketId, userId) {
    // 1. Get basket
    const basket = await Basket.findById(basketId);
    if (!basket) {
      return { errorType: 'BASKET_NOT_FOUND', message: 'Basket not found' };
    }

    // 2. Check basket is not empty
    if (!basket.items || basket.items.length === 0) {
      return { errorType: 'BASKET_EMPTY', message: 'Basket is empty' };
    }

    // 3. Verify items against Catalog Service
    let totalAmount = 0;
    const verifiedItems = [];

    for (const item of basket.items) {
      try {
        const catalogResponse = await axios.get(`${CATALOG_SERVICE_URL}/cakes/${item.cakeId}`);
        const cake = catalogResponse.data.data;

        if (!cake) {
          return { errorType: 'CAKE_NOT_FOUND', message: `Cake with ID ${item.cakeId} not found in catalog` };
        }

        if (!cake.availability) {
          return { errorType: 'CAKE_UNAVAILABLE', message: `Cake "${cake.name}" is currently unavailable` };
        }

        const itemTotal = cake.price * item.quantity;
        totalAmount += itemTotal;

        verifiedItems.push({
          cakeId: item.cakeId,
          quantity: item.quantity,
          price: cake.price
        });
      } catch (err) {
        if (err.response && err.response.status === 404) {
          return { errorType: 'CAKE_NOT_FOUND', message: `Cake with ID ${item.cakeId} not found in catalog service` };
        }
        console.error(`[OrderService] Catalog Service communication error for cakeId ${item.cakeId}:`, err.message);
        return { errorType: 'CATALOG_SERVICE_UNAVAILABLE', message: 'Catalog Service unavailable or returned an error' };
      }
    }

    // 4. Create order
    const order = await Order.create({
      userId,
      items: verifiedItems,
      totalAmount,
      status: 'CONFIRMED'
    });

    console.log(`[OrderService] Order created successfully: ID ${order._id}, Total: $${totalAmount}`);

    // 5. Clear basket
    basket.items = [];
    await basket.save();

    // 6. Publish OrderCompleted event to RabbitMQ
    const eventPayload = {
      eventId: `event-${order._id}-${Date.now()}`,
      eventType: 'OrderCompleted',
      orderId: order._id.toString(),
      userId: order.userId,
      totalAmount: order.totalAmount,
      message: `Your order #${order._id} has been confirmed. Total: $${order.totalAmount}`
    };

    publishOrderCompletedEvent(eventPayload);

    return { success: true, order };
  }

  async getOrderById(id) {
    return await Order.findById(id);
  }

  async getOrders(userId) {
    const filter = {};
    if (userId) filter.userId = userId;
    return await Order.find(filter).sort({ createdAt: -1 });
  }
}

module.exports = new OrderService();
