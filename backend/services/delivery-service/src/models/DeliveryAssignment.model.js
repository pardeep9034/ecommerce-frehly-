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
        type: DataTypes.BIGINT,
        allowNull: false
      },
      warehouse_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      delivery_partner_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      delivery_slot_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      assignment_source: {
        type: DataTypes.ENUM("AUTO", "MANUAL"),
        allowNull: false,
        defaultValue: "MANUAL"
      },
      assigned_by: {
        type: DataTypes.BIGINT
      },
      assigned_at: {
        type: DataTypes.DATE
      },
      pickup_name: {
        type: DataTypes.STRING(150)
      },
      pickup_address: {
        type: DataTypes.TEXT
      },
      pickup_latitude: {
        type: DataTypes.DECIMAL(10, 8)
      },
      pickup_longitude: {
        type: DataTypes.DECIMAL(11, 8)
      },
      pickup_contact_name: {
        type: DataTypes.STRING(100)
      },
      pickup_contact_phone: {
        type: DataTypes.STRING(20)
      },
      customer_name: {
        type: DataTypes.STRING(150)
      },
      customer_phone: {
        type: DataTypes.STRING(20)
      },
      delivery_address: {
        type: DataTypes.TEXT
      },
      delivery_latitude: {
        type: DataTypes.DECIMAL(10, 8)
      },
      delivery_longitude: {
        type: DataTypes.DECIMAL(11, 8)
      },
      status: {
        type: DataTypes.ENUM("ACTIVE", "TRANSFERRED", "COMPLETED", "CANCELLED", "FAILED"),
        allowNull: false,
        defaultValue: "ACTIVE"
      },
      cancellation_reason: {
        type: DataTypes.TEXT
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

    DeliveryAssignment.belongsTo(models.DeliveryZone, {
      foreignKey: "zone_id",
      as: "deliveryZone"
    });
  };

  return DeliveryAssignment;
};
