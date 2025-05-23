const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Food = sequelize.define(
  "Food",
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
    type: {
      type: DataTypes.ENUM("ochtend", "middag", "avond", "snack", "drinken"),
      allowNull: false,
    },
    kcal_per_100: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    kcal_per_portion: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    grams_per_portion: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    proteine_per_100: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    fats_per_100: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    sugar_per_100: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING,
    },
    unit: {
      type: DataTypes.ENUM("gr", "ml"), // New field: Measurement unit
      allowNull: false,
      defaultValue: "gr",
    },
    portion_description: {
      type: DataTypes.STRING, // New field: Describe portion size
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING), // New field: Tags for filtering
      allowNull: true,
      defaultValue: [],
    },
    main_category: {
      type: DataTypes.ENUM(
        "fruit",
        "groenten",
        "zuivel",
        "vlees",
        "vis",
        "vegetarisch",
        "drinken",
        "brood & granen",
        "maaltijd",
        "smeersels & sauzen",
        "soep",
        "bijgerechten",
        "snacks & zoetigheid",
        "overig",
      ),
      allowNull: true,
    },
  },
  {
    timestamps: true,
    freezeTableName: true, // Prevent Sequelize from pluralizing table name
  }
);

module.exports = Food;
