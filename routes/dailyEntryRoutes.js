const express = require("express");
const {
  getDailyEntries,
  logDailyEntry,
  getWeeklyEntries,
  updateDailyEntry,
  removeDailyEntry,
} = require("../controllers/dailyEntryController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getDailyEntries);
router.post("/", protect, logDailyEntry);
router.get("/weekly", protect, getWeeklyEntries);
router.put("/:id", protect, updateDailyEntry);
router.delete("/:id", protect, removeDailyEntry);

module.exports = router;
