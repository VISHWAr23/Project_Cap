const cakeService = require('../services/cakeService');

// Get all cakes with optional filters (name, category, minPrice, maxPrice)
exports.getCakes = async (req, res, next) => {
  try {
    const cakes = await cakeService.getCakes(req.query);
    return res.status(200).json({ success: true, count: cakes.length, data: cakes });
  } catch (error) {
    console.error('Error fetching cakes:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching cakes' });
  }
};

// Get single cake by ID
exports.getCakeById = async (req, res, next) => {
  try {
    const cake = await cakeService.getCakeById(req.params.id);
    if (!cake) {
      return res.status(404).json({ success: false, message: 'Cake not found' });
    }
    return res.status(200).json({ success: true, data: cake });
  } catch (error) {
    console.error('Error fetching cake by ID:', error.message);
    return res.status(400).json({ success: false, message: 'Invalid cake ID format' });
  }
};

// Create a new cake
exports.createCake = async (req, res, next) => {
  try {
    const cake = await cakeService.createCake(req.body);
    return res.status(201).json({ success: true, data: cake });
  } catch (error) {
    console.error('Error creating cake:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Update cake by ID
exports.updateCake = async (req, res, next) => {
  try {
    const cake = await cakeService.updateCake(req.params.id, req.body);
    if (!cake) {
      return res.status(404).json({ success: false, message: 'Cake not found' });
    }
    return res.status(200).json({ success: true, data: cake });
  } catch (error) {
    console.error('Error updating cake:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Delete cake by ID
exports.deleteCake = async (req, res, next) => {
  try {
    const cake = await cakeService.deleteCake(req.params.id);
    if (!cake) {
      return res.status(404).json({ success: false, message: 'Cake not found' });
    }
    return res.status(200).json({ success: true, message: 'Cake deleted successfully' });
  } catch (error) {
    console.error('Error deleting cake:', error.message);
    return res.status(400).json({ success: false, message: 'Invalid cake ID format' });
  }
};
