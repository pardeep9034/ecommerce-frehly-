import { DataTypes } from "sequelize";

export default (sequelize) => {
  const DeliveryAttempt = sequelize.define(
    "DeliveryAttempt",
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
      attempt_number: {
        type: DataTypes.INTEGER
      },
      failure_reason: {
        type: DataTypes.STRING
      },
      remarks: {
        type: DataTypes.TEXT
      },
      attempted_at: {
        type: DataTypes.DATE
      }
    },
    {
      tableName: "delivery_attempts",
      timestamps: false
    }
  );

  DeliveryAttempt.associate = (models) => {
    DeliveryAttempt.belongsTo(models.DeliveryPartner, {
      foreignKey: "delivery_partner_id",
      as: "deliveryPartner"
    });
  };

  return DeliveryAttempt;
};
