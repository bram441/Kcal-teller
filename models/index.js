const { sequelize } = require("../config/db");
const User = require("./User");
const Food = require("./Food");
const DailyEntry = require("./DailyEntry");
const Recipe = require("./Recipe");

// Define Associations
User.hasMany(DailyEntry, { foreignKey: "user_id" });
Food.hasMany(DailyEntry, { foreignKey: "food_id" });
DailyEntry.belongsTo(User, { foreignKey: "user_id" });
DailyEntry.belongsTo(Food, { foreignKey: "food_id" });

User.hasMany(Recipe, { foreignKey: "user_id" });
Recipe.belongsTo(User, { foreignKey: "user_id" });

module.exports = { sequelize, User, Food, DailyEntry };
