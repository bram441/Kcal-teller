const express = require("express");
const { getFoods, createFood } = require("../controllers/foodController");
const { protect, admin } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", protect, getFoods);
router.post("/", protect, admin, createFood);

module.exports = router;
