const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Task', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT
        },
        dueDate: {
            type: DataTypes.DATE
        },
        priority: {
            type: DataTypes.ENUM('Low', 'Medium', 'High'),
            defaultValue: 'Low'
        },
        status: {
            type: DataTypes.ENUM('To Do', 'In Progress', 'Completed'),
            defaultValue: 'To Do'
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });
};