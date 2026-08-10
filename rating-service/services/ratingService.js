const axios = require('axios');
const Rating = require('../models/Rating');

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3001';

class RatingService {
  async updateCatalogCakeRating(cakeId) {
    try {
      const ratings = await Rating.find({ cakeId });
      let averageRating = 0;
      const ratingCount = ratings.length;

      if (ratingCount > 0) {
        const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
        averageRating = Number((sum / ratingCount).toFixed(1));
      }

      await axios.put(`${CATALOG_SERVICE_URL}/cakes/${cakeId}`, {
        averageRating,
        ratingCount
      });

      console.log(`[RatingService] Updated Catalog Service for cake ${cakeId}: averageRating = ${averageRating}, ratingCount = ${ratingCount}`);
      return { averageRating, ratingCount };
    } catch (err) {
      console.error(`[RatingService] Failed to update Catalog Service rating for cake ${cakeId}:`, err.message);
    }
  }

  async createRating({ cakeId, userId, orderId, rating, review }) {
    const newRating = await Rating.create({
      cakeId,
      userId,
      orderId: orderId || null,
      rating: Number(rating),
      review: review || ''
    });

    await this.updateCatalogCakeRating(cakeId);
    console.log(`[RatingService] Rating created for cake ${cakeId}: ${rating} stars by user ${userId}`);
    return newRating;
  }

  async getCakeRatings(cakeId) {
    return await Rating.find({ cakeId }).sort({ createdAt: -1 });
  }

  async getAverageRating(cakeId) {
    const ratings = await Rating.find({ cakeId });
    if (ratings.length === 0) {
      return { cakeId, averageRating: 0, totalRatings: 0 };
    }

    const totalSum = ratings.reduce((sum, r) => sum + r.rating, 0);
    const avg = Number((totalSum / ratings.length).toFixed(1));

    return {
      cakeId,
      averageRating: avg,
      totalRatings: ratings.length
    };
  }

  async getRatingById(id) {
    return await Rating.findById(id);
  }

  async updateRating(id, updateData) {
    const updatedRating = await Rating.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (updatedRating) {
      await this.updateCatalogCakeRating(updatedRating.cakeId);
      console.log(`[RatingService] Updated rating ID ${id}`);
    }
    return updatedRating;
  }

  async deleteRating(id) {
    const rating = await Rating.findByIdAndDelete(id);
    if (rating) {
      await this.updateCatalogCakeRating(rating.cakeId);
      console.log(`[RatingService] Deleted rating ID ${id}`);
    }
    return rating;
  }
}

module.exports = new RatingService();
