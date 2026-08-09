const express = require('express');
const router = express.Router();
const basketController = require('../controllers/basketController');

router.post('/', basketController.createBasket);
router.get('/:id', basketController.getBasket);
router.post('/:id/items', basketController.addItemToBasket);
router.put('/:id/items/:itemId', basketController.updateBasketItem);
router.delete('/:id/items/:itemId', basketController.removeItemFromBasket);
router.delete('/:id', basketController.clearBasket);

module.exports = router;
