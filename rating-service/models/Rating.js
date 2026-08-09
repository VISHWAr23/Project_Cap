const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  cakeId: {
    type: String,
    required: [true, 'cakeId is required']
  },
  userId: {
    type: String,
    required: [true, 'userId is required']
  },
  orderId: {
    type: String
  },
  rating: {
    type: Number,
    required: [true, 'Rating value is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  review: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Rating', ratingSchema);
