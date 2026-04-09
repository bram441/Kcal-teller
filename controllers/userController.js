const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { Op } = require("sequelize");
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// @desc Register new user
// @route POST /api/users/register
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || typeof username !== "string" || username.trim().length < 3) {
    res.status(400);
    throw new Error("Username must be at least 3 characters");
  }

  if (!email || !emailRegex.test(String(email).toLowerCase())) {
    res.status(400);
    throw new Error("A valid email is required");
  }

  if (!password || String(password).length < MIN_PASSWORD_LENGTH) {
    res.status(400);
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const userExists = await User.findOne({ where: { email: normalizedEmail } });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    username: username.trim(),
    email: normalizedEmail,
    password_hash: hashedPassword,
  });

  res.status(201).json({ message: "User registered successfully" });
});

// @desc Login user
// @route POST /api/users/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (user && (await bcrypt.compare(password, user.password_hash))) {
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      ),
      kcal_goal: user.kcal_goal,
    });
  } else {
    res.status(401);
    throw new Error("Invalid credentials");
  }
});

// @desc Request password reset
// @route POST /api/users/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || !emailRegex.test(String(email).toLowerCase())) {
    res.status(400);
    throw new Error("A valid email is required");
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    return res.json({
      message: "If an account exists, a password reset email has been sent",
    });
  }

  // Generate a reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Save the hashed token and expiration in the database
  user.reset_token = resetTokenHash;
  user.reset_token_expiration = Date.now() + 3600000; // 1 hour
  await user.save();

  // Send the reset email
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
        <h2 style="text-align: center; color: #333;">Password Reset Request</h2>
        <p style="font-size: 16px; color: #555;">
          Hello <strong>${user.username}</strong>,
        </p>
        <p style="font-size: 16px; color: #555;">
          You requested a password reset. Click the button below to reset your password. This link will expire in 1 hour.
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #007bff; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 14px; color: #999; text-align: center;">
          If you did not request this, please ignore this email.
        </p>
        <p style="font-size: 14px; color: #999; text-align: center;">
          &copy; ${new Date().getFullYear()} Kcal Teller
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);

  res.json({ message: "If an account exists, a password reset email has been sent" });
});

// @desc Reset password
// @route POST /api/users/reset-password/:token
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || String(password).length < MIN_PASSWORD_LENGTH) {
    res.status(400);
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    where: {
      reset_token: hashedToken,
      reset_token_expiration: { [Op.gt]: Date.now() }, // Ensure token is not expired
    },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired token");
  }

  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  user.password_hash = await bcrypt.hash(password, salt);

  // Clear the reset token and expiration
  user.reset_token = null;
  user.reset_token_expiration = null;
  await user.save();

  res.json({ message: "Password reset successful" });
});
// @desc Update user profile
// @route PUT /api/users/profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { username, email, password, kcal_goal } = req.body;

  // Update fields if provided
  if (username !== undefined) {
    if (typeof username !== "string" || username.trim().length < 3) {
      res.status(400);
      throw new Error("Username must be at least 3 characters");
    }
    user.username = username.trim();
  }
  if (email !== undefined) {
    const normalizedEmail = String(email).toLowerCase().trim();
    if (!emailRegex.test(normalizedEmail)) {
      res.status(400);
      throw new Error("A valid email is required");
    }
    user.email = normalizedEmail;
  }
  if (kcal_goal !== undefined) {
    const parsedGoal = Number(kcal_goal);
    if (!Number.isFinite(parsedGoal) || parsedGoal <= 0) {
      res.status(400);
      throw new Error("kcal_goal must be a positive number");
    }
    user.kcal_goal = parsedGoal;
  }

  if (password) {
    if (String(password).length < MIN_PASSWORD_LENGTH) {
      res.status(400);
      throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(password, salt);
  }

  await user.save();

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    kcal_goal: user.kcal_goal,
  });
});

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  updateUserProfile,
};
