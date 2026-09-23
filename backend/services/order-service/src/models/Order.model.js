import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Order = sequelize.define(
    "Orders",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      order_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM(
          // Payment
          "PENDING_PAYMENT",
          "PAYMENT_FAILED",
          "PAYMENT_EXPIRED",

          // Order
          "PLACED",
          "CONFIRMED",

          // Inventory
          "READY_FOR_ASSIGNMENT",
          "AWAITING_CUSTOMER_CONFIRMATION",

          // Delivery
          "ASSIGNED",
          "PICKED_UP",
          "OUT_FOR_DELIVERY",
          "HANDOVER_IN_PROGRESS",

          // Final
          "DELIVERED",
          "CANCELLED",
          "DELIVERY_FAILED"
        ),
        allowNull: false,
        defaultValue: "PLACED"
      },
      subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      },
      delivery_fee: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      discount_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      total_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      },
      refunded_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      payment_status: {
        type: DataTypes.ENUM("PENDING", "SUCCESS", "FAILED", "REFUNDED"),
        allowNull: false
      },
      idempotency_key: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      placed_at: {
        type: DataTypes.DATE
      }
    },
    {
      tableName: "orders",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );

  Order.associate = (models) => {
    Order.hasMany(models.OrderItem, {
      foreignKey: "order_id",
      as: "items"
    });

    Order.hasOne(models.OrderAddress, {
      foreignKey: "order_id",
      as: "address"
    });

    Order.hasMany(models.OrderStatusHistory, {
      foreignKey: "order_id",
      as: "statusHistory"
    });

    Order.hasMany(models.Payment, {
      foreignKey: "order_id",
      as: "payments"
    });
  };

  return Order;
};
