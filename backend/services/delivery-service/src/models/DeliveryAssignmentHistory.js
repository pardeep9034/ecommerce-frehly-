import { DataTypes } from "sequelize";

export default (sequelize) => {
  const DeliveryAssignmentHistory = sequelize.define(
    "DeliveryAssignmentHistory",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      order_id: {
        type: DataTypes.BIGINT,
        allowNull:false
      },
      assignment_id :{
        data:DataTypes.UUID,
        allowNull:false
      },
      action :{
        type:DataTypes.ENUM("ASSIGNED","REASSIGNED","CANCELLED","COMPLETED")
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
      changed_by: {
        type: DataTypes.BIGINT
      },
      changed_at: {
        type: DataTypes.DATE
      }
    },
    {
      tableName: "delivery_assignment_history",
      timestamps: true,
      createdAt:"created_at",
      updatedAt:false
    }
  );

  DeliveryAssignmentHistory.associate = (models) => {
    DeliveryAssignmentHistory.belongsTo(models.DeliveryPartner, {
      foreignKey: "old_delivery_partner_id",
      as: "oldDeliveryPartner"
    });

    DeliveryAssignmentHistory.belongsTo(models.DeliveryPartner, {
      foreignKey: "new_delivery_partner_id",
      as: "newDeliveryPartner"
    });
  };

  return DeliveryAssignmentHistory;
};
