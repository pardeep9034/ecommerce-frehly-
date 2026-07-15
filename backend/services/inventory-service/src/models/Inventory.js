import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Inventory = sequelize.define(
    "Inventory",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },

      variant_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true,
      },

      warehouse_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: "warehouses",
          key: "id",
        },
      },

      current_stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      reserved_stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      low_stock_threshold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },

      last_stock_update_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "inventory",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );



  return Inventory;
};