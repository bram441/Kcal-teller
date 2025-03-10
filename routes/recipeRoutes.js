const express = require("express");
const {
  getRecipes,
  getRecipeByUserId,
  getSharedRecipes,
  getAllUserRecipes,
  createRecipe,
  updateRecipe,
  updateRecipeUserIds,
} = require("../controllers/recipeController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getRecipes);
router.get("/user", protect, getRecipeByUserId);
router.get("/shared", protect, getSharedRecipes);
router.get("/all", protect, getAllUserRecipes);
router.post("/", protect, createRecipe);
router.put("/:id", protect, updateRecipe);
router.put("/:id/users", protect, updateRecipeUserIds);

module.exports = router;
