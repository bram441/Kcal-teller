const express = require("express");
const {
  getFoods,
  createFood,
  updateFood,
  deleteFood,
} = require("../controllers/foodController");
const { protect, admin } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", protect, getFoods);
router.post("/", protect, admin, createFood);
router.put("/:id", protect, admin, updateFood); // Update food
router.delete("/:id", protect, admin, deleteFood); // Delete food

module.exports = router;
