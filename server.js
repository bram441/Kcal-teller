const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { connectDB } = require("./config/db");
const { sequelize } = require("./models");
const errorHandler = require("./middleware/errorMiddleware");
const {
  authLimiter,
  passwordResetLimiter,
  openAiLimiter,
} = require("./middleware/rateLimitMiddleware");
const userRoutes = require("./routes/userRoutes");
const foodRoutes = require("./routes/foodRoutes");
const dailyEntryRoutes = require("./routes/dailyEntryRoutes");
const recipeRoutes = require("./routes/recipeRoutes");
const openaiRoute = require("./routes/openaiRoute");

dotenv.config();
connectDB();

const app = express();
const isDevelopment = process.env.NODE_ENV === "development";
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(express.json({ limit: "10mb" })); // Increase JSON payload limit
app.use(express.urlencoded({ limit: "10mb", extended: true })); // Increase URL-encoded payload limit
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isDevelopment || allowedOrigins.length === 0) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);
app.use("/api/users/forgot-password", passwordResetLimiter);
app.use("/api/users/reset-password", passwordResetLimiter);
app.use("/api/openai", openAiLimiter);

// Routes
app.use("/api/users", userRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/daily-entries", dailyEntryRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/openai", openaiRoute);

// Error Handling Middleware
app.use(errorHandler);

const bootstrapDatabase = async () => {
  if (isDevelopment) {
    await sequelize.sync({ alter: true });
    console.log("Database models synchronized (development mode).");
    return;
  }

  await sequelize.authenticate();
  console.log("Database connection verified (production mode).");
};

const PORT = process.env.PORT || 5000;
bootstrapDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error("Server bootstrap failed:", error);
    process.exit(1);
  });
