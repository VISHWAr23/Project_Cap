const ratingService = require('../services/ratingService');

// Create a rating
exports.createRating = async (req, res, next) => {
  try {
    const newRating = await ratingService.createRating(req.body);
    return res.status(201).json({ success: true, data: newRating });
  } catch (error) {
    console.error('Error creating rating:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Get all ratings
exports.getAllRatings = async (req, res, next) => {
  try {
    const ratings = await ratingService.getAllRatings();
    return res.status(200).json({ success: true, count: ratings.length, data: ratings });
  } catch (error) {
    console.error('Error fetching all ratings:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching all ratings' });
  }
};

// Get ratings for a specific cake
exports.getCakeRatings = async (req, res, next) => {
  try {
    const ratings = await ratingService.getCakeRatings(req.params.cakeId);
    return res.status(200).json({ success: true, count: ratings.length, data: ratings });
  } catch (error) {
    console.error('Error fetching cake ratings:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching ratings' });
  }
};

// Get average rating for a cake
exports.getAverageRating = async (req, res, next) => {
  try {
    const summary = await ratingService.getAverageRating(req.params.cakeId);
    return res.status(200).json(summary);
  } catch (error) {
    console.error('Error calculating average rating:', error.message);
    return res.status(500).json({ success: false, message: 'Server error calculating average rating' });
  }
};

// Get single rating by ID
exports.getRatingById = async (req, res, next) => {
  try {
    const rating = await ratingService.getRatingById(req.params.id);
    if (!rating) {
      return res.status(404).json({ success: false, message: 'Rating not found' });
    }
    return res.status(200).json({ success: true, data: rating });
  } catch (error) {
    console.error('Error fetching rating by ID:', error.message);
    return res.status(400).json({ success: false, message: 'Invalid rating ID format' });
  }
};

// Update rating by ID
exports.updateRating = async (req, res, next) => {
  try {
    const updatedRating = await ratingService.updateRating(req.params.id, req.body);
    if (!updatedRating) {
      return res.status(404).json({ success: false, message: 'Rating not found' });
    }
    return res.status(200).json({ success: true, data: updatedRating });
  } catch (error) {
    console.error('Error updating rating:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Delete rating by ID
exports.deleteRating = async (req, res, next) => {
  try {
    const rating = await ratingService.deleteRating(req.params.id);
    if (!rating) {
      return res.status(404).json({ success: false, message: 'Rating not found' });
    }
    return res.status(200).json({ success: true, message: 'Rating deleted successfully' });
  } catch (error) {
    console.error('Error deleting rating:', error.message);
    return res.status(400).json({ success: false, message: 'Invalid rating ID format' });
  }
};
