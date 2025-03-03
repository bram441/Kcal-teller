const express = require("express");
const {
  getDailyEntries,
  logDailyEntry,
  getWeeklyEntries,
} = require("../controllers/dailyEntryController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getDailyEntries);
router.post("/", protect, logDailyEntry);
router.get("/weekly", protect, getWeeklyEntries);

module.exports = router;
