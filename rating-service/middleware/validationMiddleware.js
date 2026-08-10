exports.validateCreateRating = (req, res, next) => {
  const { cakeId, userId, rating } = req.body;
  if (!cakeId) {
    return res.status(400).json({ success: false, message: 'cakeId is required' });
  }
  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId is required' });
  }
  if (rating === undefined || rating === null || Number(rating) < 1 || Number(rating) > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be a number between 1 and 5' });
  }
  next();
};

exports.validateUpdateRating = (req, res, next) => {
  const { rating } = req.body;
  if (rating !== undefined && (Number(rating) < 1 || Number(rating) > 5)) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
  }
  next();
};
