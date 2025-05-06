const express = require("express");
const router = express.Router();
const {
  extractNutritionInfo,
  analyzeIntake,
} = require("../controllers/openaiController");

// Route to extract nutrition information
router.post("/extract-nutrition", extractNutritionInfo);
router.post("/analyze-intake", analyzeIntake);

module.exports = router;
