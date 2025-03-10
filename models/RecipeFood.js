const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const RecipeFood = sequelize.define(
  "RecipeFood",
  {
    recipe_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "Recipes",
        key: "id",
      },
    },
    food_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "Foods",
        key: "id",
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { timestamps: false }
);

module.exports = RecipeFood;
