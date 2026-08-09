const axios = require('axios');
const Basket = require('../models/Basket');
const Order = require('../models/Order');
const { publishOrderCompletedEvent } = require('../rabbitmq');

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3001';

// Checkout process
exports.checkout = async (req, res) => {
  try {
    const { basketId, userId } = req.body;

    if (!basketId) {
      return res.status(400).json({ success: false, message: 'basketId is required' });
    }
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    // 1. Get basket
    const basket = await Basket.findById(basketId);
    if (!basket) {
      return res.status(404).json({ success: false, message: 'Basket not found' });
    }

    // 2. Check basket is not empty
    if (!basket.items || basket.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Basket is empty' });
    }

    // 3, 4, 5, 6. Call Catalog Service REST API for each cake & verify availability + price
    let totalAmount = 0;
    const verifiedItems = [];

    for (const item of basket.items) {
      try {
        const catalogResponse = await axios.get(`${CATALOG_SERVICE_URL}/cakes/${item.cakeId}`);
        const cake = catalogResponse.data.data;

        if (!cake) {
          return res.status(404).json({
            success: false,
            message: `Cake with ID ${item.cakeId} not found in catalog`
          });
        }

        if (!cake.availability) {
          return res.status(400).json({
            success: false,
            message: `Cake "${cake.name}" is currently unavailable`
          });
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
          return res.status(404).json({
            success: false,
            message: `Cake with ID ${item.cakeId} not found in catalog service`
          });
        }
        console.error(`Catalog Service communication error for cakeId ${item.cakeId}:`, err.message);
        return res.status(503).json({
          success: false,
          message: 'Catalog Service unavailable or returned an error'
        });
      }
    }

    // 8. Create order
    const order = await Order.create({
      userId,
      items: verifiedItems,
      totalAmount,
      status: 'CONFIRMED'
    });

    console.log(`Order created successfully: ID ${order._id}, Total: $${totalAmount}`);

    // 9. Clear basket
    basket.items = [];
    await basket.save();

    // 10. Publish OrderCompleted event to RabbitMQ
    const eventPayload = {
      eventId: `event-${order._id}-${Date.now()}`,
      eventType: 'OrderCompleted',
      orderId: order._id.toString(),
      userId: order.userId,
      totalAmount: order.totalAmount,
      message: `Your order #${order._id} has been confirmed. Total: $${order.totalAmount}`
    };

    publishOrderCompletedEvent(eventPayload);

    return res.status(201).json({
      success: true,
      message: 'Checkout completed successfully',
      data: order
    });
  } catch (error) {
    console.error('Error during checkout:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order by ID:', error.message);
    return res.status(400).json({ success: false, message: 'Invalid order ID format' });
  }
};

// Get all orders (with optional userId filter)
exports.getOrders = async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching orders' });
  }
};
