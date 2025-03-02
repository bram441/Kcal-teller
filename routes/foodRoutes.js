const express = require('express');
const { getFoods, createFood } = require('../controllers/foodController');

const router = express.Router();

router.route('/').get(getFoods).post(createFood);

module.exports = router;
