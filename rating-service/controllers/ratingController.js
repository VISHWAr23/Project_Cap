const axios = require('axios');
const Rating = require('../models/Rating');

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3001';

// Helper function to recalculate average rating for a specific cakeId and update Catalog Service via REST
const updateCatalogCakeRating = async (cakeId) => {
  try {
    const ratings = await Rating.find({ cakeId });
    let averageRating = 0;
    const ratingCount = ratings.length;

    if (ratingCount > 0) {
      const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
      averageRating = Number((sum / ratingCount).toFixed(1));
    }

    // Call Catalog Service REST API to update the cake's stored averageRating and ratingCount
    await axios.put(`${CATALOG_SERVICE_URL}/cakes/${cakeId}`, {
      averageRating,
      ratingCount
    });

    console.log(`Updated Catalog Service for cake ${cakeId}: averageRating = ${averageRating}, ratingCount = ${ratingCount}`);
    return { averageRating, ratingCount };
  } catch (err) {
    console.error(`Failed to update Catalog Service rating for cake ${cakeId}:`, err.message);
  }
};

// Create a rating
exports.createRating = async (req, res) => {
  try {
    const { cakeId, userId, orderId, rating, review } = req.body;

    if (!cakeId) {
      return res.status(400).json({ success: false, message: 'cakeId is required' });
    }
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }
    if (rating === undefined || rating === null || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be a number between 1 and 5' });
    }

    const newRating = await Rating.create({
      cakeId,
      userId,
      orderId: orderId || null,
      rating: Number(rating),
      review: review || ''
    });

    // Recalculate and update Catalog Service
    await updateCatalogCakeRating(cakeId);

    console.log(`Rating created for cake ${cakeId}: ${rating} stars by user ${userId}`);
    return res.status(201).json({ success: true, data: newRating });
  } catch (error) {
    console.error('Error creating rating:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Get ratings for a specific cake
exports.getCakeRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ cakeId: req.params.cakeId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: ratings.length, data: ratings });
  } catch (error) {
    console.error('Error fetching cake ratings:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching ratings' });
  }
};

// Get average rating for a cake
exports.getAverageRating = async (req, res) => {
  try {
    const { cakeId } = req.params;
    const ratings = await Rating.find({ cakeId });

    if (ratings.length === 0) {
      return res.status(200).json({
        cakeId,
        averageRating: 0,
        totalRatings: 0
      });
    }

    const totalSum = ratings.reduce((sum, r) => sum + r.rating, 0);
    const avg = Number((totalSum / ratings.length).toFixed(1));

    return res.status(200).json({
      cakeId,
      averageRating: avg,
      totalRatings: ratings.length
    });
  } catch (error) {
    console.error('Error calculating average rating:', error.message);
    return res.status(500).json({ success: false, message: 'Server error calculating average rating' });
  }
};

// Get single rating by ID
exports.getRatingById = async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id);
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
exports.updateRating = async (req, res) => {
  try {
    const { rating } = req.body;
    if (rating !== undefined && (Number(rating) < 1 || Number(rating) > 5)) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const updatedRating = await Rating.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updatedRating) {
      return res.status(404).json({ success: false, message: 'Rating not found' });
    }

    // Recalculate and update Catalog Service
    await updateCatalogCakeRating(updatedRating.cakeId);

    console.log(`Updated rating ID ${req.params.id}`);
    return res.status(200).json({ success: true, data: updatedRating });
  } catch (error) {
    console.error('Error updating rating:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Delete rating by ID
exports.deleteRating = async (req, res) => {
  try {
    const rating = await Rating.findByIdAndDelete(req.params.id);
    if (!rating) {
      return res.status(404).json({ success: false, message: 'Rating not found' });
    }

    // Recalculate and update Catalog Service
    await updateCatalogCakeRating(rating.cakeId);

    console.log(`Deleted rating ID ${req.params.id}`);
    return res.status(200).json({ success: true, message: 'Rating deleted successfully' });
  } catch (error) {
    console.error('Error deleting rating:', error.message);
    return res.status(400).json({ success: false, message: 'Invalid rating ID format' });
  }
};
