const orderService = require('../services/orderService');

// Checkout process
exports.checkout = async (req, res, next) => {
  try {
    const { basketId, userId } = req.body;
    const result = await orderService.processCheckout(basketId, userId);

    if (!result.success) {
      if (result.errorType === 'BASKET_NOT_FOUND' || result.errorType === 'CAKE_NOT_FOUND') {
        return res.status(404).json({ success: false, message: result.message });
      }
      if (result.errorType === 'BASKET_EMPTY' || result.errorType === 'CAKE_UNAVAILABLE') {
        return res.status(400).json({ success: false, message: result.message });
      }
      if (result.errorType === 'CATALOG_SERVICE_UNAVAILABLE') {
        return res.status(503).json({ success: false, message: result.message });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Checkout completed successfully',
      data: result.order
    });
  } catch (error) {
    console.error('Error during checkout:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get order by ID
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
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
exports.getOrders = async (req, res, next) => {
  try {
    const { userId } = req.query;
    const orders = await orderService.getOrders(userId);
    return res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching orders' });
  }
};
