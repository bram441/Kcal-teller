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
    total_proteins: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    total_fats: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    total_sugars: {
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
