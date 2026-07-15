import { DataTypes } from "sequelize";

export default (sequelize) => {
  const DeliveryZone = sequelize.define(
    "DeliveryZone",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
 
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      state: {
        type: DataTypes.STRING(100)
      },
      country: {
        type: DataTypes.STRING(100)
      },
      postal_codes: {
        type: DataTypes.TEXT
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8)
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8)
      },
      radius_km: {
        type: DataTypes.DECIMAL(5, 2)
      },
      delivery_fee: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
      },
      minimum_order_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
      },
      estimated_delivery_time: {
        type: DataTypes.INTEGER
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      tableName: "delivery_zones",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );

  DeliveryZone.associate = (models) => {
    DeliveryZone.hasMany(models.DeliveryPartnerZone, {
      foreignKey: "zone_id",
      as: "partnerZones"
    });

 DeliveryZone.hasMany(DeliveryPartner,{
    foreignKey:"zone_id",
    as:"partners"
});
  };

  return DeliveryZone;
};
