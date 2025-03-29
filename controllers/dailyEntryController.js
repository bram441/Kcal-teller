const asyncHandler = require("../utils/asyncHandler");
const DailyEntry = require("../models/DailyEntry");
const Food = require("../models/Food");
const Recipe = require("../models/Recipe");
const { Op, Sequelize } = require("sequelize");

// @desc Get daily calorie intake for user
// @route GET /api/daily-entries
const getDailyEntries = asyncHandler(async (req, res) => {
  const user_id = req.user.id; // Extract user ID from token
  const date = req.query.date || new Date();

  // Fetch daily entries and join with the food or recipe table to get the name
  const entries = await DailyEntry.findAll({
    where: { user_id, date },
    include: [
      {
        model: Food,
        attributes: ["name", "unit"],
        required: false,
      },
      {
        model: Recipe,
        attributes: ["name"],
        required: false,
      },
    ],
    attributes: [
      "id",
      "food_id",
      "recipe_id",
      "total_kcal",
      "total_proteins",
      "total_fats",
      "total_sugars",
      "amount",
      "entry_type",
      "createdAt",
    ],
  });

  // Group entries by food_id or recipe_id
  const groupedEntries = entries.reduce((acc, entry) => {
    const existingEntry = acc.find((item) => {
      if (item.entry_type !== entry.entry_type) {
        return false; // Ensure the entry types match
      }

      if (entry.entry_type === "food") {
        return item.food_id === entry.food_id; // Compare food_id for food entries
      }

      if (entry.entry_type === "recipe") {
        return item.recipe_id === entry.recipe_id; // Compare recipe_id for recipe entries
      }

      return false; // Default case (shouldn't happen)
    });
    if (existingEntry) {
      existingEntry.total_kcal += entry.total_kcal;
      existingEntry.total_proteins += entry.total_proteins;
      existingEntry.total_fats += entry.total_fats;
      existingEntry.total_sugars += entry.total_sugars;
      existingEntry.amount += entry.amount;
    } else {
      acc.push({
        food_id: entry.food_id,
        recipe_id: entry.recipe_id,
        name:
          entry.entry_type === "food"
            ? entry.Food?.name || "Unknown Food"
            : entry.Recipe?.name || "Unknown Recipe",
        unit: entry.entry_type === "food" ? entry.Food?.unit || "N/A" : null,
        total_kcal: entry.total_kcal,
        total_proteins: entry.total_proteins,
        total_fats: entry.total_fats,
        total_sugars: entry.total_sugars,
        amount: entry.amount,
        entry_type: entry.entry_type,
      });
    }
    return acc;
  }, []);

  // Calculate total calories
  const totalCalories = groupedEntries.reduce(
    (sum, entry) => sum + entry.total_kcal,
    0
  );

  const totalProteins = groupedEntries.reduce(
    (sum, entry) => sum + entry.total_proteins,
    0
  );
  const totalFats = groupedEntries.reduce(
    (sum, entry) => sum + entry.total_fats,
    0
  );
  const totalSugars = groupedEntries.reduce(
    (sum, entry) => sum + entry.total_sugars,
    0
  );

  res.json({
    totalCalories,
    totalProteins,
    totalFats,
    totalSugars,
    entries: groupedEntries,
    entriesSeperate: entries,
  });
});

// @desc Log food consumption
// @route POST /api/daily-entries
const logDailyEntry = asyncHandler(async (req, res) => {
  const user_id = req.user.id; // Extract user ID from token
  const {
    food_id,
    recipe_id,
    total_kcal,
    total_proteins,
    total_fats,
    total_sugars,
    amount, 
    entry_type,
    date,
  } = req.body;

  const entry = await DailyEntry.create({
    user_id,
    food_id,
    recipe_id,
    total_kcal,
    total_proteins,
    total_fats,
    total_sugars,
    amount,
    entry_type,
    date: date || new Date(),
  });
  res.status(201).json(entry);
});

const getWeeklyEntries = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weeklyData = await DailyEntry.findAll({
    where: { user_id, date: { [Op.gte]: oneWeekAgo } },
    attributes: [
      "date",
      [Sequelize.fn("SUM", Sequelize.col("total_kcal")), "totalCalories"],
      [Sequelize.fn("SUM", Sequelize.col("total_proteins")), "totalProteins"],
      [Sequelize.fn("SUM", Sequelize.col("total_fats")), "totalFats"],
      [Sequelize.fn("SUM", Sequelize.col("total_sugars")), "totalSugars"],
    ],
    group: ["date"],
    order: [["date", "ASC"]],
  });

  res.json(weeklyData);
});

const removeDailyEntry = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;

  const entry = await DailyEntry.destroy({
    where: { user_id, id },
  });

  res.json(entry);
});

module.exports = {
  getDailyEntries,
  logDailyEntry,
  getWeeklyEntries,
  removeDailyEntry,
};
