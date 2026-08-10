exports.validateAddItem = (req, res, next) => {
  const { cakeId, quantity } = req.body;
  if (!cakeId) {
    return res.status(400).json({ success: false, message: 'cakeId is required' });
  }
  if (quantity === undefined || Number(quantity) <= 0) {
    return res.status(400).json({ success: false, message: 'quantity must be greater than 0' });
  }
  next();
};

exports.validateUpdateItem = (req, res, next) => {
  const { quantity } = req.body;
  if (quantity === undefined || Number(quantity) <= 0) {
    return res.status(400).json({ success: false, message: 'quantity must be greater than 0' });
  }
  next();
};

exports.validateCheckout = (req, res, next) => {
  const { basketId, userId } = req.body;
  if (!basketId) {
    return res.status(400).json({ success: false, message: 'basketId is required' });
  }
  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId is required' });
  }
  next();
};
