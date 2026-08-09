const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');

router.post('/', ratingController.createRating);
router.get('/cake/:cakeId', ratingController.getCakeRatings);
router.get('/cake/:cakeId/average', ratingController.getAverageRating);
router.get('/:id', ratingController.getRatingById);
router.put('/:id', ratingController.updateRating);
router.delete('/:id', ratingController.deleteRating);

module.exports = router;
