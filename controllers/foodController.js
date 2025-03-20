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
  try {
    const formattedTags = Array.isArray(tags)
      ? tags.map((tag) => tag.trim())
      : []; // ✅ Ensure it's an array

    const newFood = await Food.create({
      name,
      type,
      kcal_per_100,
      kcal_per_portion,
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
  const food = await Food.findByPk(id);

  if (!food) {
    res.status(404);
    throw new Error("Food not found");
  }

  await food.destroy();
  res.json({ message: "Food deleted" });
});

module.exports = { getFoods, createFood, updateFood, deleteFood };
