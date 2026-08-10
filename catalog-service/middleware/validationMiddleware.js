exports.validateCreateCake = (req, res, next) => {
  const { name, category, price } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Cake name is required' });
  }
  if (!category || !category.trim()) {
    return res.status(400).json({ success: false, message: 'Category is required' });
  }
  if (price === undefined || price === null || Number(price) <= 0) {
    return res.status(400).json({ success: false, message: 'Price must be greater than 0' });
  }
  next();
};

exports.validateUpdateCake = (req, res, next) => {
  const { price } = req.body;
  if (price !== undefined && Number(price) <= 0) {
    return res.status(400).json({ success: false, message: 'Price must be greater than 0' });
  }
  next();
};
