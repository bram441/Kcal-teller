const express = require('express');
const { getDailyEntries, logDailyEntry } = require('../controllers/dailyEntryController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getDailyEntries);
router.post('/', protect, logDailyEntry);

module.exports = router;
