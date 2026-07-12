import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Payment = sequelize.define(
    "Payments",
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
      payment_method: {
        type: DataTypes.ENUM("COD", "UPI", "CARD", "NET_BANKING", "WALLET")
      },
      transaction_id: {
        type: DataTypes.STRING(255)
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2)
      },
      status: {
        type: DataTypes.ENUM("PENDING", "SUCCESS", "FAILED", "REFUNDED", "EXPIRED")
      },
      gateway_response: {
        type: DataTypes.TEXT
      },
      paid_at: {
        type: DataTypes.DATE
      }
    },
    {
      tableName: "payments",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false
    }
  );

  Payment.associate = (models) => {
    Payment.belongsTo(models.Order, {
      foreignKey: "order_id",
      as: "order"
    });
  };

  return Payment;
};
