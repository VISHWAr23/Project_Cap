const Basket = require('../models/Basket');

// Create a new basket
exports.createBasket = async (req, res) => {
  try {
    const { userId } = req.body;
    const basket = await Basket.create({
      userId: userId || 'user-123',
      items: []
    });

    console.log(`Basket created: ${basket._id} for user ${basket.userId}`);
    return res.status(201).json({ success: true, data: basket });
  } catch (error) {
    console.error('Error creating basket:', error.message);
    return res.status(500).json({ success: false, message: 'Server error creating basket' });
  }
};

// Get basket by ID
exports.getBasket = async (req, res) => {
  try {
    const basket = await Basket.findById(req.params.id);
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
exports.addItemToBasket = async (req, res) => {
  try {
    const { cakeId, quantity, price } = req.body;

    if (!cakeId) {
      return res.status(400).json({ success: false, message: 'cakeId is required' });
    }

    if (quantity === undefined || Number(quantity) <= 0) {
      return res.status(400).json({ success: false, message: 'quantity must be greater than 0' });
    }

    const basket = await Basket.findById(req.params.id);
    if (!basket) {
      return res.status(404).json({ success: false, message: 'Basket not found' });
    }

    // Check if cake already in basket
    const existingIndex = basket.items.findIndex(item => item.cakeId.toString() === cakeId.toString());

    if (existingIndex > -1) {
      basket.items[existingIndex].quantity += Number(quantity);
      if (price) basket.items[existingIndex].price = Number(price);
    } else {
      basket.items.push({
        cakeId,
        quantity: Number(quantity),
        price: price ? Number(price) : 0
      });
    }

    await basket.save();
    console.log(`Added item ${cakeId} to basket ${basket._id}`);
    return res.status(200).json({ success: true, data: basket });
  } catch (error) {
    console.error('Error adding item to basket:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Update item quantity in basket
exports.updateBasketItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { id, itemId } = req.params;

    if (quantity === undefined || Number(quantity) <= 0) {
      return res.status(400).json({ success: false, message: 'quantity must be greater than 0' });
    }

    const basket = await Basket.findById(id);
    if (!basket) {
      return res.status(404).json({ success: false, message: 'Basket not found' });
    }

    const item = basket.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in basket' });
    }

    item.quantity = Number(quantity);
    await basket.save();

    console.log(`Updated item ${itemId} quantity to ${quantity} in basket ${id}`);
    return res.status(200).json({ success: true, data: basket });
  } catch (error) {
    console.error('Error updating basket item:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Remove item from basket
exports.removeItemFromBasket = async (req, res) => {
  try {
    const { id, itemId } = req.params;

    const basket = await Basket.findById(id);
    if (!basket) {
      return res.status(404).json({ success: false, message: 'Basket not found' });
    }

    const itemIndex = basket.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in basket' });
    }

    basket.items.splice(itemIndex, 1);
    await basket.save();

    console.log(`Removed item ${itemId} from basket ${id}`);
    return res.status(200).json({ success: true, data: basket });
  } catch (error) {
    console.error('Error removing item from basket:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Clear basket
exports.clearBasket = async (req, res) => {
  try {
    const basket = await Basket.findById(req.params.id);
    if (!basket) {
      return res.status(404).json({ success: false, message: 'Basket not found' });
    }

    basket.items = [];
    await basket.save();

    console.log(`Cleared basket ${req.params.id}`);
    return res.status(200).json({ success: true, message: 'Basket cleared', data: basket });
  } catch (error) {
    console.error('Error clearing basket:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};
