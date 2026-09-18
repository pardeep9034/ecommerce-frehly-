import { DataTypes } from "sequelize";

export default (sequelize) => {
  const DeliverySlot = sequelize.define(
    "DeliverySlot",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      name: {
        type: DataTypes.STRING
      },
      start_time: {
        type: DataTypes.TIME
      },
      end_time: {
        type: DataTypes.TIME
      },
      is_active: {
        type: DataTypes.BOOLEAN
      }
    },
    {
      tableName: "delivery_slots",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );

  DeliverySlot.associate = (models) => {
    DeliverySlot.hasMany(models.DeliveryAssignment, {
      foreignKey: "delivery_slot_id",
      as: "assignments"
    });
  };

  return DeliverySlot;
};
