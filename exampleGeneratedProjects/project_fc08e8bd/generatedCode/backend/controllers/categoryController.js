const { Category } = require('../models');

module.exports = {
    async getAllCategories(req, res) {
        try {
            const categories = await Category.findAll();
            res.status(200).json(categories);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async createCategory(req, res) {
        try {
            const { name } = req.body;
            const category = await Category.create({ name });
            res.status(201).json(category);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};