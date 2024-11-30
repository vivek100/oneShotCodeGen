const bcrypt = require('bcrypt');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Task = require('../src/models/Task');
const sequelize = require('../src/config/database');

(async () => {
  await sequelize.sync({ force: true });

  const password = await bcrypt.hash('123456', 10);
  const user = await User.create({ name: 'Test User', email: 'user@example.com', password });

  const category1 = await Category.create({ name: 'Work', userId: user.id });
  const category2 = await Category.create({ name: 'Personal', userId: user.id });

  await Task.create({
    title: 'Task 1',
    description: 'Complete the project',
    dueDate: new Date(),
    priority: 'High',
    status: 'Pending',
    categoryId: category1.id,
    userId: user.id
  });

  await Task.create({
    title: 'Task 2',
    description: 'Buy groceries',
    dueDate: new Date(),
    priority: 'Medium',
    status: 'Pending',
    categoryId: category2.id,
    userId: user.id
  });
})();