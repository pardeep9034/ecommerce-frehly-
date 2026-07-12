import { DataTypes } from "sequelize";

export default (sequelize) => {
  const DeliveryHandover = sequelize.define(
    "DeliveryHandover",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      order_id: {
        type: DataTypes.UUID
      },
      old_delivery_partner_id: {
        type: DataTypes.UUID
      },
      new_delivery_partner_id: {
        type: DataTypes.UUID
      },
      reason: {
        type: DataTypes.TEXT
      },
      handover_confirmed_at: {
        type: DataTypes.DATE
      },
      receipt_confirmed_at: {
        type: DataTypes.DATE
      }
    },
    {
      tableName: "delivery_handovers",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false
    }
  );

  DeliveryHandover.associate = (models) => {
    DeliveryHandover.belongsTo(models.DeliveryPartner, {
      foreignKey: "old_delivery_partner_id",
      as: "oldDeliveryPartner"
    });

    DeliveryHandover.belongsTo(models.DeliveryPartner, {
      foreignKey: "new_delivery_partner_id",
      as: "newDeliveryPartner"
    });
  };

  return DeliveryHandover;
};
