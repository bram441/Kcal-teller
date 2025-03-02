const asyncHandler = require('../utils/asyncHandler');
const DailyEntry = require('../models/DailyEntry');

// @desc Get daily calorie intake for user
// @route GET /api/daily-entries/:user_id
const getDailyEntries = asyncHandler(async (req, res) => {
    const user_id = req.user.id; // Extract user ID from token
    const entries = await DailyEntry.findAll({ where: { user_id, date: new Date() } });

    const totalCalories = entries.reduce((sum, entry) => sum + entry.total_kcal, 0);
    res.json({ totalCalories, entries });
});

// @desc Log food consumption
// @route POST /api/daily-entries
const logDailyEntry = asyncHandler(async (req, res) => {
    const user_id = req.user.id; // Extract user ID from token
    const { food_id, total_kcal } = req.body;

    const entry = await DailyEntry.create({ user_id, food_id, total_kcal });
    res.status(201).json(entry);
});

module.exports = { getDailyEntries, logDailyEntry };
