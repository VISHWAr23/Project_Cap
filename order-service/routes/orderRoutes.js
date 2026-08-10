const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { validateCheckout } = require('../middleware/validationMiddleware');

router.post('/checkout', validateCheckout, orderController.checkout);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);

module.exports = router;
