const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Food = require('./Food');

const DailyEntry = sequelize.define('DailyEntry', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    food_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Food,
            key: 'id'
        }
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    total_kcal: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
}, { timestamps: true });

module.exports = DailyEntry;
