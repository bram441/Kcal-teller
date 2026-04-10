const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const UserFavoriteFood = sequelize.define(
  "UserFavoriteFood",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    food_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "food_id"],
      },
    ],
  }
);

module.exports = UserFavoriteFood;
