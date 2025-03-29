const asyncHandler = require("../utils/asyncHandler");
const Food = require("../models/Food");
const DailyEntry = require("../models/DailyEntry");
const RecipeFood = require("../models/RecipeFood");

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
    grams_per_portion,
    proteine_per_100,
    fats_per_100,
    sugar_per_100,
    brand,
    unit,
    portion_description,
    tags,
  } = req.body;
  try {
    const formattedTags = Array.isArray(tags)
      ? tags.map((tag) => tag.trim())
      : []; // ✅ Ensure it's an array

    const newFood = await Food.create({
      name,
      type,
      kcal_per_100,
      kcal_per_portion,
      grams_per_portion,
      proteine_per_100,
      fats_per_100,
      sugar_per_100,
      brand,
      unit,
      portion_description,
      tags: formattedTags, // ✅ Save correctly formatted tags
    });

    res.status(201).json(newFood);
  } catch (error) {
    console.error("Error adding food:", error);
    res.status(500).json({ message: "Server error while adding food." });
  }
});

// @desc Update a food item
// @route PUT /api/foods/:id
const updateFood = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const food = await Food.findByPk(id);

  if (!food) {
    res.status(404);
    throw new Error("Food not found");
  }

  const updatedFood = await food.update(req.body);
  res.json(updatedFood);
});

// @desc Delete a food item
// @route DELETE /api/foods/:id
const deleteFood = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the food
  const food = await Food.findByPk(id);

  if (!food) {
    res.status(404);
    throw new Error("Food not found");
  }

  // Check if the food is used in any recipes
  const recipesUsingFood = await food.getRecipes({
    attributes: ["id", "name"],
    through: { attributes: ["quantity"] },
  });

  // Check if the food is used in any daily entries
  const dailyEntriesUsingFood = await DailyEntry.findAll({
    where: { food_id: id },
    attributes: ["id", "date", "total_kcal"],
  });

  // If the food is being used, return the related data
  if (recipesUsingFood.length > 0 || dailyEntriesUsingFood.length > 0) {
    return res.status(200).json({
      message: "Food is being used",
      recipes: recipesUsingFood,
      dailyEntries: dailyEntriesUsingFood,
    });
  }

  // If not used, delete the food
  await food.destroy();
  res.json({ message: "Food deleted" });
});

// @desc Force delete food and related entries
// @route DELETE /api/foods/:id/force
const forceDeleteFood = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find recipes associated with the food
  const recipesUsingFood = await Recipe.findAll({
    include: {
      model: RecipeFood,
      where: { food_id: id },
    },
  });

  // Delete the associated recipes
  for (const recipe of recipesUsingFood) {
    await recipe.destroy();
  }

  // Delete related daily entries
  await DailyEntry.destroy({ where: { food_id: id } });

  // Delete the food
  const food = await Food.findByPk(id);
  if (food) {
    await food.destroy();
  }

  res.json({ message: "Food, related recipes, and daily entries deleted" });
});

module.exports = { getFoods, createFood, updateFood, deleteFood, forceDeleteFood };

