const express = require('express');
const router = express.Router();
const cakeController = require('../controllers/cakeController');

router.get('/', cakeController.getCakes);
router.get('/:id', cakeController.getCakeById);
router.post('/', cakeController.createCake);
router.put('/:id', cakeController.updateCake);
router.delete('/:id', cakeController.deleteCake);

module.exports = router;
