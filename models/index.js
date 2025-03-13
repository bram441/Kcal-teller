const { sequelize } = require("../config/db");
const User = require("./User");
const Food = require("./Food");
const DailyEntry = require("./DailyEntry");
const Recipe = require("./Recipe");
const RecipeFood = require("./RecipeFood");

// Define Associations
User.hasMany(DailyEntry, { foreignKey: "user_id" });
Food.hasMany(DailyEntry, { foreignKey: "food_id" });
Recipe.hasMany(DailyEntry, { foreignKey: "recipe_id" });
DailyEntry.belongsTo(User, { foreignKey: "user_id" });
DailyEntry.belongsTo(Food, { foreignKey: "food_id" });
DailyEntry.belongsTo(Recipe, { foreignKey: "recipe_id" });

User.hasMany(Recipe, { foreignKey: "user_id" });
Recipe.belongsTo(User, { foreignKey: "user_id" });
Recipe.belongsToMany(Food, {
  through: RecipeFood,
  as: "foods",
  foreignKey: "recipe_id",
});
Food.belongsToMany(Recipe, {
  through: RecipeFood,
  as: "recipes",
  foreignKey: "food_id",
});

module.exports = { sequelize, User, Food, DailyEntry, Recipe, RecipeFood };
