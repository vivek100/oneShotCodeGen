const { Task, Category } = require('../models');

module.exports = {
    async getAllTasks(req, res) {
        try {
            const tasks = await Task.findAll({ include: Category });
            res.status(200).json(tasks);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async createTask(req, res) {
        try {
            const { title, description, dueDate, priority, status, categories } = req.body;
            const task = await Task.create({ title, description, dueDate, priority, status });
            if (categories) {
                const categoryInstances = await Category.findAll({ where: { id: categories } });
                await task.setCategories(categoryInstances);
            }
            res.status(201).json(task);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async updateTask(req, res) {
        try {
            const { id } = req.params;
            const { title, description, dueDate, priority, status, categories } = req.body;
            const task = await Task.findByPk(id);
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }
            await task.update({ title, description, dueDate, priority, status });
            if (categories) {
                const categoryInstances = await Category.findAll({ where: { id: categories } });
                await task.setCategories(categoryInstances);
            }
            res.status(200).json(task);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async deleteTask(req, res) {
        try {
            const { id } = req.params;
            const task = await Task.findByPk(id);
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }
            await task.destroy();
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};