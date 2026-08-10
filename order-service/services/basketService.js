const Basket = require('../models/Basket');

class BasketService {
  async getOrCreateBasket(userId = 'user-123') {
    let basket = await Basket.findOne({ userId });
    if (basket) {
      console.log(`[BasketService] Found existing basket ${basket._id} for user ${userId}`);
      return { basket, created: false };
    }

    basket = await Basket.create({
      userId,
      items: []
    });

    console.log(`[BasketService] Basket created: ${basket._id} for user ${basket.userId}`);
    return { basket, created: true };
  }

  async getBasketById(id) {
    return await Basket.findById(id);
  }

  async addItemToBasket(basketId, { cakeId, quantity, price }) {
    const basket = await Basket.findById(basketId);
    if (!basket) return null;

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
    console.log(`[BasketService] Added item ${cakeId} to basket ${basket._id}`);
    return basket;
  }

  async updateBasketItem(basketId, itemId, quantity) {
    const basket = await Basket.findById(basketId);
    if (!basket) return { status: 'BASKET_NOT_FOUND' };

    const item = basket.items.id(itemId);
    if (!item) return { status: 'ITEM_NOT_FOUND' };

    item.quantity = Number(quantity);
    await basket.save();

    console.log(`[BasketService] Updated item ${itemId} quantity to ${quantity} in basket ${basketId}`);
    return { status: 'SUCCESS', basket };
  }

  async removeItemFromBasket(basketId, itemId) {
    const basket = await Basket.findById(basketId);
    if (!basket) return { status: 'BASKET_NOT_FOUND' };

    const itemIndex = basket.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) return { status: 'ITEM_NOT_FOUND' };

    basket.items.splice(itemIndex, 1);
    await basket.save();

    console.log(`[BasketService] Removed item ${itemId} from basket ${basketId}`);
    return { status: 'SUCCESS', basket };
  }

  async clearBasket(basketId) {
    const basket = await Basket.findById(basketId);
    if (!basket) return null;

    basket.items = [];
    await basket.save();

    console.log(`[BasketService] Cleared basket ${basketId}`);
    return basket;
  }
}

module.exports = new BasketService();
