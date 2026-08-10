const express = require('express');
const router = express.Router();
const cakeController = require('../controllers/cakeController');
const { validateCreateCake, validateUpdateCake } = require('../middleware/validationMiddleware');

router.get('/', cakeController.getCakes);
router.get('/:id', cakeController.getCakeById);
router.post('/', validateCreateCake, cakeController.createCake);
router.put('/:id', validateUpdateCake, cakeController.updateCake);
router.delete('/:id', cakeController.deleteCake);

module.exports = router;
