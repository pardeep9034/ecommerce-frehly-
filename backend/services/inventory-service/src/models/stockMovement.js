import { DataTypes } from "sequelize";

export default (sequelize) => {
  const StockMovement = sequelize.define(
    "StockMovement",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },

      variant_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
       
      },

      movement_type: {
        type: DataTypes.ENUM(
          "STOCK_IN",
          "SALE",
          "ADJUSTMENT",
          "DAMAGE",
          "RETURN"
        ),
        allowNull: false,
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      before_stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      after_stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      created_by: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
    },
    {
      tableName: "stock_movements",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  return StockMovement;
};