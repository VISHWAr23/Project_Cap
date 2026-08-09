const Cake = require('../models/Cake');

// Get all cakes with optional filters (name, category, minPrice, maxPrice)
exports.getCakes = async (req, res) => {
  try {
    const { name, category, minPrice, maxPrice } = req.query;
    const filter = {};

    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const cakes = await Cake.find(filter);
    return res.status(200).json({ success: true, count: cakes.length, data: cakes });
  } catch (error) {
    console.error('Error fetching cakes:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching cakes' });
  }
};

// Get single cake by ID
exports.getCakeById = async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id);
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
exports.createCake = async (req, res) => {
  try {
    const { name, description, category, price, availability, imageUrl } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Cake name is required' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }
    if (price === undefined || price === null || Number(price) <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be greater than 0' });
    }

    const cake = await Cake.create({
      name: name.trim(),
      description: description || '',
      category: category.trim(),
      price: Number(price),
      availability: availability !== undefined ? availability : true,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500'
    });

    console.log(`Created cake: ${cake.name} (ID: ${cake._id})`);
    return res.status(201).json({ success: true, data: cake });
  } catch (error) {
    console.error('Error creating cake:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Update cake by ID
exports.updateCake = async (req, res) => {
  try {
    const { name, category, price } = req.body;
    if (price !== undefined && Number(price) <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be greater than 0' });
    }

    const cake = await Cake.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!cake) {
      return res.status(404).json({ success: false, message: 'Cake not found' });
    }

    console.log(`Updated cake ID ${req.params.id}`);
    return res.status(200).json({ success: true, data: cake });
  } catch (error) {
    console.error('Error updating cake:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Delete cake by ID
exports.deleteCake = async (req, res) => {
  try {
    const cake = await Cake.findByIdAndDelete(req.params.id);
    if (!cake) {
      return res.status(404).json({ success: false, message: 'Cake not found' });
    }
    console.log(`Deleted cake ID ${req.params.id}`);
    return res.status(200).json({ success: true, message: 'Cake deleted successfully' });
  } catch (error) {
    console.error('Error deleting cake:', error.message);
    return res.status(400).json({ success: false, message: 'Invalid cake ID format' });
  }
};
