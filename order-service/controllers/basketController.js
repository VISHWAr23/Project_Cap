const basketService = require('../services/basketService');

// Create a new basket (or return existing active basket for user)
exports.createBasket = async (req, res, next) => {
  try {
    const targetUserId = req.body.userId || 'user-123';
    const { basket, created } = await basketService.getOrCreateBasket(targetUserId);
    return res.status(created ? 201 : 200).json({ success: true, data: basket });
  } catch (error) {
    console.error('Error creating basket:', error.message);
    return res.status(500).json({ success: false, message: 'Server error creating basket' });
  }
};

// Get basket by ID
exports.getBasket = async (req, res, next) => {
  try {
    const basket = await basketService.getBasketById(req.params.id);
    if (!basket) {
      return res.status(404).json({ success: false, message: 'Basket not found' });
    }
    return res.status(200).json({ success: true, data: basket });
  } catch (error) {
    console.error('Error fetching basket:', error.message);
    return res.status(400).json({ success: false, message: 'Invalid basket ID format' });
  }
};

// Add cake item to basket
exports.addItemToBasket = async (req, res, next) => {
  try {
    const basket = await basketService.addItemToBasket(req.params.id, req.body);
    if (!basket) {
      return res.status(404).json({ success: false, message: 'Basket not found' });
    }
    return res.status(200).json({ success: true, data: basket });
  } catch (error) {
    console.error('Error adding item to basket:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Update item quantity in basket
exports.updateBasketItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { id, itemId } = req.params;

    const result = await basketService.updateBasketItem(id, itemId, quantity);
    if (result.status === 'BASKET_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Basket not found' });
    }
    if (result.status === 'ITEM_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Item not found in basket' });
    }
    return res.status(200).json({ success: true, data: result.basket });
  } catch (error) {
    console.error('Error updating basket item:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Remove item from basket
exports.removeItemFromBasket = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    const result = await basketService.removeItemFromBasket(id, itemId);

    if (result.status === 'BASKET_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Basket not found' });
    }
    if (result.status === 'ITEM_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Item not found in basket' });
    }
    return res.status(200).json({ success: true, data: result.basket });
  } catch (error) {
    console.error('Error removing item from basket:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Clear basket
exports.clearBasket = async (req, res, next) => {
  try {
    const basket = await basketService.clearBasket(req.params.id);
    if (!basket) {
      return res.status(404).json({ success: false, message: 'Basket not found' });
    }
    return res.status(200).json({ success: true, message: 'Basket cleared', data: basket });
  } catch (error) {
    console.error('Error clearing basket:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};
