const { sequelize } = require("../config/db");
const User = require("./User");
const Food = require("./Food");
const DailyEntry = require("./DailyEntry");
const Recipe = require("./Recipe");
const RecipeFood = require("./RecipeFood");
const UserFavoriteFood = require("./UserFavoriteFood");
const UserFrequentFood = require("./UserFrequentFood");

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

User.hasMany(UserFavoriteFood, { foreignKey: "user_id", as: "favoriteFoods" });
Food.hasMany(UserFavoriteFood, { foreignKey: "food_id", as: "favoriteUsers" });
UserFavoriteFood.belongsTo(User, { foreignKey: "user_id" });
UserFavoriteFood.belongsTo(Food, { foreignKey: "food_id" });

User.hasMany(UserFrequentFood, { foreignKey: "user_id", as: "frequentFoods" });
Food.hasMany(UserFrequentFood, { foreignKey: "food_id", as: "frequentUsers" });
UserFrequentFood.belongsTo(User, { foreignKey: "user_id" });
UserFrequentFood.belongsTo(Food, { foreignKey: "food_id" });

module.exports = {
  sequelize,
  User,
  Food,
  DailyEntry,
  Recipe,
  RecipeFood,
  UserFavoriteFood,
  UserFrequentFood,
};
