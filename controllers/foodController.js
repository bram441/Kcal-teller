const asyncHandler = require("../utils/asyncHandler");
const Food = require("../models/Food");
const DailyEntry = require("../models/DailyEntry");
const RecipeFood = require("../models/RecipeFood");
const Recipe = require("../models/Recipe")
const UserFavoriteFood = require("../models/UserFavoriteFood");
const UserFrequentFood = require("../models/UserFrequentFood");
const {sequelize} = require("../config/db");
const { Op } = require("sequelize");
const ALLOWED_FOOD_UPDATE_FIELDS = [
  "name",
  "type",
  "kcal_per_100",
  "kcal_per_portion",
  "grams_per_portion",
  "proteine_per_100",
  "fats_per_100",
  "sugar_per_100",
  "brand",
  "unit",
  "portion_description",
  "tags",
  "main_category",
];

// @desc Get all foods
// @route GET /api/foods
const getFoods = asyncHandler(async (req, res) => {
  const foods = await Food.findAll();
  res.json(foods);
});

const getFoodsSearch = asyncHandler(async (req, res) => {
  const {
    q = "",
    brand = "",
    category = "",
    tag = "",
    page = "1",
    limit = "25",
    sort_mode = "name",
  } = req.query;
  const userId = req.user.id;

  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100);
  const offset = (parsedPage - 1) * parsedLimit;

  const where = {};
  const andConditions = [];

  const trimmedQuery = String(q).trim();
  if (trimmedQuery) {
    const words = trimmedQuery.split(/\s+/).filter(Boolean);
    andConditions.push(...words.map((word) => ({
      name: {
        [Op.iLike]: `%${word}%`,
      },
    })));
  }

  if (brand) {
    where.brand = String(brand).trim();
  }

  if (category) {
    where.main_category = String(category).trim();
  }

  const trimmedTag = String(tag).trim();
  if (trimmedTag) {
    const escapedTag = trimmedTag.replace(/'/g, "''");
    andConditions.push(
      sequelize.literal(
        `EXISTS (SELECT 1 FROM unnest("Food"."tags") AS tag WHERE tag ILIKE '%${escapedTag}%')`
      )
    );
  }

  if (andConditions.length > 0) {
    where[Op.and] = andConditions;
  }

  const favoriteInclude = {
    model: UserFavoriteFood,
    as: "favoriteUsers",
    attributes: ["id"],
    where: { user_id: userId },
    required: sort_mode === "favorites",
  };

  const frequentInclude = {
    model: UserFrequentFood,
    as: "frequentUsers",
    attributes: ["selection_count", "last_selected_at"],
    where: { user_id: userId },
    required: false,
  };

  const order = [];
  if (sort_mode === "frequent") {
    order.push(
      [{ model: UserFrequentFood, as: "frequentUsers" }, "selection_count", "DESC"]
    );
  }
  if (sort_mode === "recent") {
    order.push(
      [{ model: UserFrequentFood, as: "frequentUsers" }, "last_selected_at", "DESC"]
    );
  }
  order.push(["name", "ASC"], ["id", "ASC"]);

  const { count, rows } = await Food.findAndCountAll({
    where,
    include: [favoriteInclude, frequentInclude],
    order,
    limit: parsedLimit,
    offset,
    distinct: true,
  });

  const mappedItems = rows.map((row) => {
    const plain = row.toJSON();
    const favorite = Array.isArray(plain.favoriteUsers) && plain.favoriteUsers.length > 0;
    const frequent = Array.isArray(plain.frequentUsers) && plain.frequentUsers.length > 0
      ? plain.frequentUsers[0]
      : null;

    return {
      ...plain,
      is_favorite: favorite,
      selection_count: frequent?.selection_count || 0,
      last_selected_at: frequent?.last_selected_at || null,
    };
  });

  res.json({
    items: mappedItems,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      totalItems: count,
      totalPages: Math.max(Math.ceil(count / parsedLimit), 1),
      hasNextPage: offset + rows.length < count,
    },
  });
});

const toggleFavoriteFood = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const foodId = Number(req.params.id);
  const { is_favorite } = req.body;

  if (!Number.isInteger(foodId) || foodId <= 0) {
    res.status(400);
    throw new Error("Invalid food id");
  }

  const food = await Food.findByPk(foodId);
  if (!food) {
    res.status(404);
    throw new Error("Food not found");
  }

  if (is_favorite) {
    await UserFavoriteFood.findOrCreate({
      where: { user_id: userId, food_id: foodId },
      defaults: { user_id: userId, food_id: foodId },
    });
  } else {
    await UserFavoriteFood.destroy({ where: { user_id: userId, food_id: foodId } });
  }

  const favorite = await UserFavoriteFood.findOne({
    where: { user_id: userId, food_id: foodId },
  });

  res.json({ food_id: foodId, is_favorite: Boolean(favorite) });
});

const getUniqueBrands = asyncHandler(async (req, res) => {
  const brands = await Food.findAll({
    attributes: [
      [sequelize.fn('DISTINCT', sequelize.col('brand')), 'brand']
    ],
    where: { brand: { [Op.ne]: null } },
    order: [['brand', 'ASC']]
  });
  res.json(brands.map(b => b.brand));
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
    main_category,
  } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ message: "Food name is required." });
  }

  if (!type || !unit) {
    return res.status(400).json({ message: "Food type and unit are required." });
  }

  if ([kcal_per_100, kcal_per_portion].some((value) => !Number.isFinite(Number(value)) || Number(value) < 0)) {
    return res.status(400).json({ message: "Calories must be valid numbers >= 0." });
  }

  try {
      const existingFood = await Food.findOne({
      where: { name: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('name')),
        'LIKE',
        name.toLowerCase()
      ) }
    });

    if (existingFood) {
      return res.status(409).json({ message: "Food already exists in the database." });
    }

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
      main_category,
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

  const payload = Object.fromEntries(
    Object.entries(req.body || {}).filter(([key]) =>
      ALLOWED_FOOD_UPDATE_FIELDS.includes(key)
    )
  );

  const updatedFood = await food.update(payload);
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

  const recipesUsingFood = await RecipeFood.findAll({
    where: {food_id: id}
  })

  for(const recipe of recipesUsingFood) {
    await DailyEntry.destroy({where: {recipe_id: recipe.recipe_id}})
    await Recipe.destroy({where: {id: recipe.recipe_id}});
  }

  // Delete related daily entries
  await DailyEntry.destroy({ where: { food_id: id } });

  // Detlete all recipeFood links
  await RecipeFood.destroy({ where: { food_id: id } });

  // Delete the food
  const food = await Food.findByPk(id);
  if (food) {
    await food.destroy();
  }

  res.json({ message: "Food, related recipes, and daily entries deleted" });
});

module.exports = {
  getFoods,
  getFoodsSearch,
  toggleFavoriteFood,
  getUniqueBrands,
  createFood,
  updateFood,
  deleteFood,
  forceDeleteFood,
};

