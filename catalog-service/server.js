const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const requestLogger = require('./middleware/requestLogger');
const errorMiddleware = require('./middleware/errorMiddleware');
const cakeRoutes = require('./routes/cakeRoutes');
const Cake = require('./models/Cake');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/catalog_db';

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/cakes', cakeRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'catalog-service'
  });
});

// Modular Error Handling Middleware
app.use(errorMiddleware);

// Database Connection & Initial Seed
const seedCakes = async () => {
  try {
    const count = await Cake.countDocuments();
    if (count === 0) {
      console.log('Seeding initial cakes...');
      await Cake.insertMany([
        {
          name: 'Classic Chocolate Fudge Cake',
          description: 'Rich, moist chocolate sponge coated with creamy chocolate fudge icing.',
          category: 'Chocolate',
          price: 350,
          availability: true,
          imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500'
        },
        {
          name: 'Vanilla Dream Birthday Cake',
          description: 'Fluffy vanilla layers filled with sweet butter cream and festive sprinkles.',
          category: 'Birthday',
          price: 450,
          availability: true,
          imageUrl: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=500'
        },
        {
          name: 'Strawberry Velvet Delight',
          description: 'Fresh strawberry cake layered with real strawberry preserve and whip.',
          category: 'Fruit',
          price: 400,
          availability: true,
          imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500'
        },
        {
          name: 'Red Velvet Royale',
          description: 'Traditional red velvet sponge with rich cream cheese frosting.',
          category: 'Specialty',
          price: 550,
          availability: true,
          imageUrl: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=500'
        },
        {
          name: 'Black Forest Celebration Cake',
          description: 'Classic German cake layered with cherries, cream, and chocolate flakes.',
          category: 'Birthday',
          price: 600,
          availability: true,
          imageUrl: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=500'
        }
      ]);
      console.log('Catalog database seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding cakes database:', err.message);
  }
};

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`Database connected: ${MONGO_URI}`);
    seedCakes();
    app.listen(PORT, () => {
      console.log(`Catalog Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failure:', err.message);
  });

module.exports = app;
