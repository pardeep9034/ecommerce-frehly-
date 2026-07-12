import { DataTypes } from "sequelize";

export default (sequelize) => {
  const DeliveryAssignment = sequelize.define(
    "DeliveryAssignment",
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
      delivery_slot_id: {
        type: DataTypes.UUID
      },
      assignment_source: {
        type: DataTypes.STRING
      },
      assigned_by: {
        type: DataTypes.UUID
      },
      assigned_at: {
        type: DataTypes.DATE
      },
      status: {
        type: DataTypes.STRING
      }
    },
    {
      tableName: "delivery_assignments",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );

  DeliveryAssignment.associate = (models) => {
    DeliveryAssignment.belongsTo(models.DeliveryPartner, {
      foreignKey: "delivery_partner_id",
      as: "deliveryPartner"
    });

    DeliveryAssignment.belongsTo(models.DeliverySlot, {
      foreignKey: "delivery_slot_id",
      as: "deliverySlot"
    });
  };

  return DeliveryAssignment;
};
