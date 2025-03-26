const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Recipe = sequelize.define(
  "Recipe",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    total_kcals: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    total_proteine: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    total_fats: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    total_sugar: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_ids: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
    },
  },
  { timestamps: true }
);

module.exports = Recipe;
