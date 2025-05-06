const express = require("express");
const router = express.Router();
const { extractNutritionInfo } = require("../controllers/openaiController");

// Route to extract nutrition information
router.post("/extract-nutrition", extractNutritionInfo);

module.exports = router;
