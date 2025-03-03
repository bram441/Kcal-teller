const asyncHandler = require("../utils/asyncHandler");
const DailyEntry = require("../models/DailyEntry");
const Food = require("../models/Food");
const { Op, Sequelize } = require("sequelize");

// @desc Get daily calorie intake for user
// @route GET /api/daily-entries
const getDailyEntries = asyncHandler(async (req, res) => {
  const user_id = req.user.id; // Extract user ID from token

  // Fetch daily entries and join with the food table to get food name
  const entries = await DailyEntry.findAll({
    where: { user_id, date: new Date() },
    include: [{ model: Food, attributes: ["name", "unit"] }], // Get food name
    attributes: ["food_id", "total_kcal", "amount", "createdAt"],
  });

  // Group entries by food_id
  const groupedEntries = entries.reduce((acc, entry) => {
    const existingEntry = acc.find((item) => item.food_id === entry.food_id);
    if (existingEntry) {
      existingEntry.total_kcal += entry.total_kcal;
      existingEntry.amount += entry.amount;
    } else {
      acc.push({
        food_id: entry.food_id,
        name: entry.Food.name,
        unit: entry.Food.unit,
        total_kcal: entry.total_kcal,
        amount: entry.amount,
      });
    }
    return acc;
  }, []);

  // Calculate total calories
  const totalCalories = groupedEntries.reduce(
    (sum, entry) => sum + entry.total_kcal,
    0
  );

  res.json({
    totalCalories,
    entries: groupedEntries,
    entriesSeperate: entries,
  });
});

// @desc Log food consumption
// @route POST /api/daily-entries
const logDailyEntry = asyncHandler(async (req, res) => {
  const user_id = req.user.id; // Extract user ID from token
  const { food_id, total_kcal, amount } = req.body;

  const entry = await DailyEntry.create({
    user_id,
    food_id,
    total_kcal,
    amount,
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
    ],
    group: ["date"],
    order: [["date", "ASC"]],
  });

  res.json(weeklyData);
});

module.exports = { getDailyEntries, logDailyEntry, getWeeklyEntries };
