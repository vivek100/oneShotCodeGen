const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const taskRoutes = require('./taskRoutes');
const categoryRoutes = require('./categoryRoutes');

router.use('/auth', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/categories', categoryRoutes);

module.exports = router;