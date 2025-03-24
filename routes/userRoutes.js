const express = require("express");
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  updateUserProfile,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.put("/profile", protect, updateUserProfile);

module.exports = router;
