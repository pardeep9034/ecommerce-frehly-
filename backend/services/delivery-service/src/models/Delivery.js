import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Delivery = sequelize.define(
    "Delivery",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      trackingNumber: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
      },
      carrier: {
        type: DataTypes.STRING,
        defaultValue: "Freshly Express"
      },
      status: {
        type: DataTypes.ENUM("PENDING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"),
        defaultValue: "PENDING"
      },
      estimatedDelivery: {
        type: DataTypes.DATE,
        allowNull: true
      },
      actualDelivery: {
        type: DataTypes.DATE,
        allowNull: true
      },
      deliveryAddress: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      recipientName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      recipientPhone: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      tableName: "deliveries",
      timestamps: true
    }
  );

  return Delivery;
};
