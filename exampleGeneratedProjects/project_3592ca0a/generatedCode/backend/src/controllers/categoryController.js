const Category = require('../models/Category');

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({ where: { userId: req.user.id } });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.create({ name, userId: req.user.id });
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};