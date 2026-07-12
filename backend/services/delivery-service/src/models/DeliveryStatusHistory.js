import { DataTypes } from "sequelize";

export default (sequelize) => {
  const DeliveryStatusHistory = sequelize.define(
    "DeliveryStatusHistory",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      order_id: {
        type: DataTypes.UUID
      },
      delivery_partner_id: {
        type: DataTypes.UUID
      },
      status: {
        type: DataTypes.STRING
      },
      remarks: {
        type: DataTypes.TEXT
      }
    },
    {
      tableName: "delivery_status_history",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false
    }
  );

  DeliveryStatusHistory.associate = (models) => {
    DeliveryStatusHistory.belongsTo(models.DeliveryPartner, {
      foreignKey: "delivery_partner_id",
      as: "deliveryPartner"
    });
  };

  return DeliveryStatusHistory;
};
