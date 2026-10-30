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
          "DELIVERY_FAILED",
          "RETURNED_TO_STORE"
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
      warehouse_id: {
        type: DataTypes.BIGINT,
        allowNull: true // owned by inventory-service, so no FK
      },
      picked_by: {
        type: DataTypes.BIGINT,
        allowNull: true // the staff user who finalized the items; owned by auth-service, so no FK
      },
      // Set by store staff when they pack the order (packOrder); packed_at is the "packed" flag.
      packed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      bag_count: {
        type: DataTypes.SMALLINT,
        allowNull: true
      },
      rack_label: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      // What the rider took at the door on a COD order (CASH or UPI); null until delivered.
      collected_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
      },
      collected_method: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      collected_at: {
        type: DataTypes.DATE,
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

    Order.hasMany(models.OrderReturn, {
      foreignKey: "order_id",
      as: "returns"
    });
  };

  return Order;
};
