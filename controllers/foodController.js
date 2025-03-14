const asyncHandler = require("../utils/asyncHandler");
const Food = require("../models/Food");

// @desc Get all foods
// @route GET /api/foods
const getFoods = asyncHandler(async (req, res) => {
  const foods = await Food.findAll();
  res.json(foods);
});

// @desc Create a food item
// @route POST /api/foods
const createFood = asyncHandler(async (req, res) => {
  const {
    name,
    type,
    kcal_per_100,
    kcal_per_portion,
    brand,
    unit,
    portion_description,
    tags,
  } = req.body;

  const food = await Food.create({
    name,
    type,
    kcal_per_100,
    kcal_per_portion,
    brand,
    unit,
    portion_description,
    tags,
  });

  res.status(201).json(food);
});

module.exports = { getFoods, createFood };
