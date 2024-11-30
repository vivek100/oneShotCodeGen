const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
});

const models = {};
models.Task = require('./task')(sequelize);
models.Category = require('./category')(sequelize);

models.Task.belongsToMany(models.Category, { through: 'TaskCategories' });
models.Category.belongsToMany(models.Task, { through: 'TaskCategories' });

module.exports = { sequelize, ...models };