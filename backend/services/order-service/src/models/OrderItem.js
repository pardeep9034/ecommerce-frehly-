import { DataTypes } from "sequelize";

export default (sequelize) => {
  const OrderItem = sequelize.define(
    "OrderItems",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      order_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      product_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      variant_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      sku: {
        type: DataTypes.STRING(100)
      },
      product_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      variant_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      unit: {
        type: DataTypes.STRING(50)
      },
      quantity: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false
      },
      mrp: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      },
      selling_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      },
      line_total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      }
    },
    {
      tableName: "order_items",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false
    }
  );

  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order, {
      foreignKey: "order_id",
      as: "order"
    });
  };

  return OrderItem;
};
