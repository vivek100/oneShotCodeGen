const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

router.get('/', auth, taskController.getAllTasks);
router.post('/', auth, taskController.createTask);

module.exports = router;