const express = require("express");
const { protect, admin } = require("../middleware/authMiddleware");
const router = express.Router();
const {
  extractNutritionInfo,
  analyzeIntake,
} = require("../controllers/openaiController");

// Route to extract nutrition information
router.post("/extract-nutrition", protect, admin, extractNutritionInfo);
router.post("/analyze-intake", protect, analyzeIntake);

module.exports = router;
