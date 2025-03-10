const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const { connectDB } = require("./config/db");
const { sequelize } = require("./models");
const errorHandler = require("./middleware/errorMiddleware");
const userRoutes = require("./routes/userRoutes");
const foodRoutes = require("./routes/foodRoutes");
const dailyEntryRoutes = require("./routes/dailyEntryRoutes");
const recipeRoutes = require("./routes/recipeRoutes");

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/daily-entries", dailyEntryRoutes);
app.use("/api/recipes", recipeRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Sync database (ensures models & associations are applied)
sequelize.sync({ alter: true }).then(() => {
  console.log("Database models synchronized!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
