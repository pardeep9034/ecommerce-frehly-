import { DataTypes } from "sequelize";

export default (sequelize) => {
  const DeliveryPartnerZone = sequelize.define(
    "DeliveryPartnerZone",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      delivery_partner_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      zone_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      is_primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      tableName: "delivery_partner_zones",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false
    }
  );

  DeliveryPartnerZone.associate = (models) => {
    DeliveryPartnerZone.belongsTo(models.DeliveryPartner, {
      foreignKey: "delivery_partner_id",
      as: "deliveryPartner"
    });

    DeliveryPartnerZone.belongsTo(models.DeliveryZone, {
      foreignKey: "zone_id",
      as: "zone"
    });
  };

  return DeliveryPartnerZone;
};
