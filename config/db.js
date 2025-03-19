const { Sequelize } = require("sequelize");
require("dotenv").config();

const isDevelopment = process.env.NODE_ENV === "development";

const sequelize = new Sequelize(
  isDevelopment ? process.env.LOCAL_DB_NAME : process.env.ONLINE_DB_NAME,
  isDevelopment ? process.env.LOCAL_DB_USER : process.env.ONLINE_DB_USER,
  isDevelopment
    ? process.env.LOCAL_DB_PASSWORD
    : process.env.ONLINE_DB_PASSWORD,
  {
    host: isDevelopment
      ? process.env.LOCAL_DB_HOST
      : process.env.ONLINE_DB_HOST,
    dialect: isDevelopment
      ? process.env.LOCAL_DB_DIALECT
      : process.env.ONLINE_DB_DIALECT,
    logging: false, // Disable SQL logging in console
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(
      `PostgreSQL connected successfully to ${
        isDevelopment ? "local" : "online"
      } database`
    );
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
