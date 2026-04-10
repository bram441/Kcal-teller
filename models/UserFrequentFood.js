const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const UserFrequentFood = sequelize.define(
  "UserFrequentFood",
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
    selection_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    last_selected_at: {
      type: DataTypes.DATE,
      allowNull: true,
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

module.exports = UserFrequentFood;
