const asyncHandler = require("../utils/asyncHandler");
const Recipe = require("../models/Recipe");
const { Op } = require("sequelize");

// @desc Get all recipes
// @route GET /api/recipes
const getRecipes = asyncHandler(async (req, res) => {
  const recipes = await Recipe.findAll();
  res.json(recipes);
});

// @desc Get all recipes for a user
// @route GET /api/recipes/user
const getRecipeByUserId = asyncHandler(async (req, res) => {
  const recipes = await Recipe.findAll({
    where: {
      user_id: req.user.id, // Extract user ID from token
    },
  });
  res.json(recipes);
});

// @desc Get all recipes shared with a user
// @route GET /api/recipes/shared
const getSharedRecipes = asyncHandler(async (req, res) => {
  const recipes = await Recipe.findAll({
    where: {
      user_ids: {
        [Op.contains]: [req.user.id], // Check if user_ids array contains the user ID
      },
    },
  });
  res.json(recipes);
});

// @desc Get all recipes created by or shared with a user
// @route GET /api/recipes/all
const getAllUserRecipes = asyncHandler(async (req, res) => {
  const recipes = await Recipe.findAll({
    where: {
      [Op.or]: [
        { user_id: req.user.id }, // Recipes created by the user
        { user_ids: { [Op.contains]: [req.user.id] } }, // Recipes shared with the user
      ],
    },
  });
  res.json(recipes);
});

// @desc Create a recipe
// @route POST /api/recipes
const createRecipe = asyncHandler(async (req, res) => {
  const { name, food_ids, food_quantities, total_kcals, user_ids } = req.body;
  const user_id = req.user.id; // Extract user ID from token

  const recipe = await Recipe.create({
    name,
    food_ids,
    food_quantities,
    total_kcals,
    user_id,
    user_ids,
  });

  res.status(201).json(recipe);
});

// @desc Update a recipe
// @route PUT /api/recipes/:id
const updateRecipe = asyncHandler(async (req, res) => {
  const { name, food_ids, food_quantities, total_kcals } = req.body;
  const recipe = await Recipe.findByPk(req.params.id);

  if (!recipe) {
    res.status(404);
    throw new Error("Recipe not found");
  }

  if (recipe.user_id !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized to update this recipe");
  }

  recipe.name = name || recipe.name;
  recipe.food_ids = food_ids || recipe.food_ids;
  recipe.food_quantities = food_quantities || recipe.food_quantities;
  recipe.total_kcals = total_kcals || recipe.total_kcals;

  await recipe.save();
  res.json(recipe);
});

// @desc Update user_ids for a recipe
// @route PUT /api/recipes/:id/users
const updateRecipeUserIds = asyncHandler(async (req, res) => {
  const { user_ids } = req.body;
  const recipe = await Recipe.findByPk(req.params.id);

  if (!recipe) {
    res.status(404);
    throw new Error("Recipe not found");
  }

  recipe.user_ids = user_ids || recipe.user_ids;

  await recipe.save();
  res.json(recipe);
});

module.exports = {
  getRecipes,
  getRecipeByUserId,
  getSharedRecipes,
  getAllUserRecipes,
  createRecipe,
  updateRecipe,
  updateRecipeUserIds,
};
