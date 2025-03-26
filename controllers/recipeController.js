const asyncHandler = require("../utils/asyncHandler");
const Recipe = require("../models/Recipe");
const Food = require("../models/Food");
const RecipeFood = require("../models/RecipeFood");
const { Op } = require("sequelize");

// @desc Get all recipes
// @route GET /api/recipes
const getRecipes = asyncHandler(async (req, res) => {
  const recipes = await Recipe.findAll({
    include: [
      {
        model: Food,
        as: "foods",
        attributes: ["id", "name"],
        through: {
          attributes: ["quantity"],
        },
      },
    ],
  });
  res.json(recipes);
});

const getRecipeById = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findByPk(req.params.id, {
    include: [
      {
        model: Food,
        as: "foods",
        attributes: ["id", "name", "kcal_per_100", "kcal_per_portion"],
        through: {
          attributes: ["quantity"],
        },
      },
    ],
  });
  res.json(recipe);
});

// @desc Get all recipes for a user
// @route GET /api/recipes/user
const getRecipeByUserId = asyncHandler(async (req, res) => {
  const recipes = await Recipe.findAll({
    where: {
      user_id: req.user.id, // Extract user ID from token
    },
    include: [
      {
        model: Food,
        as: "foods",
        attributes: ["id", "name"],
        through: {
          attributes: ["quantity"],
        },
      },
    ],
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
    include: [
      {
        model: Food,
        as: "foods",
        attributes: ["id", "name"],
        through: {
          attributes: ["quantity"],
        },
      },
    ],
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
    include: [
      {
        model: Food,
        as: "foods",
        attributes: ["id", "name"],
        through: {
          attributes: ["quantity"],
        },
      },
    ],
  });
  res.json(recipes);
});

// @desc Create a recipe
// @route POST /api/recipes
const createRecipe = asyncHandler(async (req, res) => {
  const {
    name,
    food_quantities,
    total_kcals,
    total_proteine,
    total_fats,
    total_sugar,
    user_ids,
  } = req.body;
  const user_id = req.user.id; // Extract user ID from token

  const recipe = await Recipe.create({
    name,
    total_kcals,
    total_proteine,
    total_fats,
    total_sugar,
    user_id,
    user_ids,
  });

  // Add food quantities to the RecipeFood join table
  for (const [food_id, quantity] of Object.entries(food_quantities)) {
    await RecipeFood.create({
      recipe_id: recipe.id,
      food_id: parseInt(food_id),
      quantity,
    });
  }

  res.status(201).json(recipe);
});

// @desc Update a recipe
// @route PUT /api/recipes/:id
const updateRecipe = asyncHandler(async (req, res) => {
  const {
    name,
    food_quantities,
    total_kcals,
    total_proteine,
    total_fats,
    total_sugar,
  } = req.body;
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
  recipe.total_kcals = total_kcals || recipe.total_kcals;
  recipe.total_proteine = total_proteine || recipe.total_proteine;
  recipe.total_fats = total_fats || recipe.total_fats;
  recipe.total_sugar = total_sugar || recipe.total_sugar;

  await recipe.save();

  // Update food quantities in the RecipeFood join table
  await RecipeFood.destroy({ where: { recipe_id: recipe.id } });

  for (const food of food_quantities) {
    const { food_id, quantity } = food; // Destructure food_id and quantity
    await RecipeFood.create({
      recipe_id: recipe.id,
      food_id: parseInt(food_id), // Ensure food_id is an integer
      quantity,
    });
  }

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

const deleteRecipeById = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findByPk(req.params.id);
  await RecipeFood.destroy({ where: { recipe_id: recipe.id } });
  await recipe.destroy();
  res.json({ message: "Recipe deleted" });
});

module.exports = {
  getRecipes,
  getRecipeById,
  getRecipeByUserId,
  getSharedRecipes,
  getAllUserRecipes,
  createRecipe,
  updateRecipe,
  updateRecipeUserIds,
  deleteRecipeById,
};
