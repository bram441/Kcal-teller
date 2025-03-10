const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Recipe = sequelize.define(
  "Recipe",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    food_ids: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
    },
    food_quantities: {
      type: DataTypes.JSON,
      allowNull: false,
      // Example: { "food_id_1": quantity, "food_id_2": quantity, ... }
    },
    total_kcals: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_ids: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
    },
  },
  { timestamps: true }
);

module.exports = Recipe;
