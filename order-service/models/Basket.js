const mongoose = require('mongoose');

const basketItemSchema = new mongoose.Schema({
  cakeId: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    default: 0
  }
});

const basketSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    default: 'user-123'
  },
  items: [basketItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Basket', basketSchema);
