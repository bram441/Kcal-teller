const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Food = sequelize.define('Food', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('ochtend', 'middag', 'avond', 'snack', 'drinken'),
        allowNull: false
    },
    kcal_per_100: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    kcal_per_portion: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    brand: {
        type: DataTypes.STRING
    }
}, { timestamps: true });

module.exports = Food;
