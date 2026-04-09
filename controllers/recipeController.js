const asyncHandler = require("../utils/asyncHandler");
const Recipe = require("../models/Recipe");
const Food = require("../models/Food");
const RecipeFood = require("../models/RecipeFood");
const { Op } = require("sequelize");

const canManageRecipe = (recipe, user) =>
  user && (user.role === "admin" || recipe.user_id === user.id);

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
        attributes: [
          "id",
          "name",
          "kcal_per_100",
          "kcal_per_portion",
          "proteine_per_100",
          "fats_per_100",
          "sugar_per_100",
        ],
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
    total_proteins,
    total_fats,
    total_sugars,
    user_ids,
  } = req.body;
  const user_id = req.user.id; // Extract user ID from token

  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400);
    throw new Error("Recipe name is required");
  }

  if (
    !food_quantities ||
    typeof food_quantities !== "object" ||
    Array.isArray(food_quantities) ||
    Object.keys(food_quantities).length === 0
  ) {
    res.status(400);
    throw new Error("food_quantities must be a non-empty object");
  }

  if (user_ids !== undefined && !Array.isArray(user_ids)) {
    res.status(400);
    throw new Error("user_ids must be an array");
  }

  const sanitizedUserIds = Array.isArray(user_ids)
    ? [...new Set(user_ids)]
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0 && id !== user_id)
    : [];

  const recipe = await Recipe.create({
    name,
    total_kcals,
    total_proteins,
    total_fats,
    total_sugars,
    user_id,
    user_ids: sanitizedUserIds,
  });

  // Add food quantities to the RecipeFood join table
  for (const [food_id, quantity] of Object.entries(food_quantities)) {
    const parsedFoodId = Number(food_id);
    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedFoodId) || parsedFoodId <= 0) {
      res.status(400);
      throw new Error("food_quantities contains invalid food_id values");
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      res.status(400);
      throw new Error("food_quantities contains invalid quantity values");
    }

    await RecipeFood.create({
      recipe_id: recipe.id,
      food_id: parsedFoodId,
      quantity: parsedQuantity,
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
    total_proteins,
    total_fats,
    total_sugars,
  } = req.body;
  const recipe = await Recipe.findByPk(req.params.id);

  if (!recipe) {
    res.status(404);
    throw new Error("Recipe not found");
  }

  if (!canManageRecipe(recipe, req.user)) {
    res.status(403);
    throw new Error("Not authorized to update this recipe");
  }

  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    res.status(400);
    throw new Error("Recipe name must be a non-empty string");
  }

  if (!Array.isArray(food_quantities) || food_quantities.length === 0) {
    res.status(400);
    throw new Error("food_quantities must be a non-empty array");
  }

  recipe.name = name || recipe.name;
  recipe.total_kcals = total_kcals || recipe.total_kcals;
  recipe.total_proteins = total_proteins || recipe.total_proteins;
  recipe.total_fats = total_fats || recipe.total_fats;
  recipe.total_sugars = total_sugars || recipe.total_sugars;

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

  if (!canManageRecipe(recipe, req.user)) {
    res.status(403);
    throw new Error("Not authorized to update shared users for this recipe");
  }

  if (!Array.isArray(user_ids)) {
    res.status(400);
    throw new Error("user_ids must be an array");
  }

  const sanitizedUserIds = [...new Set(user_ids)]
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0 && id !== recipe.user_id);

  recipe.user_ids = sanitizedUserIds;

  await recipe.save();
  res.json(recipe);
});

const deleteRecipeById = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findByPk(req.params.id);
  if (!recipe) {
    res.status(404);
    throw new Error("Recipe not found");
  }

  if (!canManageRecipe(recipe, req.user)) {
    res.status(403);
    throw new Error("Not authorized to delete this recipe");
  }

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
