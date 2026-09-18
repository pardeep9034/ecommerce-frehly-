import { DataTypes } from "sequelize";

export default (sequelize) => {
  const InventoryReservation = sequelize.define(
    "InventoryReservation",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },

      order_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },

      variant_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "product_variants",
          key: "id",
        },
      },

      warehouse_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: "warehouses",
          key: "id",
        },
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM(
          "ACTIVE",
          "CONFIRMED",
          "RELEASED",
          "EXPIRED"
        ),
        allowNull: false,
        defaultValue: "ACTIVE",
      },

      expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "inventory_reservations",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  

  return InventoryReservation;
};