const Cake = require('../models/Cake');

class CakeService {
  async getCakes(queryParams) {
    const { name, category, minPrice, maxPrice } = queryParams;
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

    return await Cake.find(filter);
  }

  async getCakeById(id) {
    return await Cake.findById(id);
  }

  async createCake(cakeData) {
    const { name, description, category, price, availability, imageUrl } = cakeData;
    const cake = await Cake.create({
      name: name.trim(),
      description: description || '',
      category: category.trim(),
      price: Number(price),
      availability: availability !== undefined ? availability : true,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500'
    });
    console.log(`[CakeService] Created cake: ${cake.name} (ID: ${cake._id})`);
    return cake;
  }

  async updateCake(id, updateData) {
    const cake = await Cake.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });
    if (cake) {
      console.log(`[CakeService] Updated cake ID ${id}`);
    }
    return cake;
  }

  async deleteCake(id) {
    const cake = await Cake.findByIdAndDelete(id);
    if (cake) {
      console.log(`[CakeService] Deleted cake ID ${id}`);
    }
    return cake;
  }
}

module.exports = new CakeService();
