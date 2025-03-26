const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const Recipe = require("./Recipe");

const DailyEntry = sequelize.define(
  "DailyEntry",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    food_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    recipe_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    total_kcal: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    total_proteins: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    total_fats: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    total_sugars: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1,
    },
    entry_type: {
      type: DataTypes.ENUM("food", "recipe"),
      allowNull: false,
      defaultValue: "food",
    },
  },
  { timestamps: true }
);

module.exports = DailyEntry;
