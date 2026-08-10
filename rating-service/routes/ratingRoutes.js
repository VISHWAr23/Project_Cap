const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { validateCreateRating, validateUpdateRating } = require('../middleware/validationMiddleware');

router.post('/', validateCreateRating, ratingController.createRating);
router.get('/cake/:cakeId', ratingController.getCakeRatings);
router.get('/cake/:cakeId/average', ratingController.getAverageRating);
router.get('/:id', ratingController.getRatingById);
router.put('/:id', validateUpdateRating, ratingController.updateRating);
router.delete('/:id', ratingController.deleteRating);

module.exports = router;
