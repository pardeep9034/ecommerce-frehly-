import { DataTypes } from "sequelize";

export default (sequelize) => {
  const DeliveryPartner = sequelize.define(
    "DeliveryPartner",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true
      },
      zone_id: {
        type: DataTypes.INTEGER
      },
      name: {
        type: DataTypes.STRING(150)
      },
      phone: {
        type: DataTypes.STRING(20)
      },
      vehicle_type: {
        type: DataTypes.STRING
      },
      vehicle_number: {
        type: DataTypes.STRING
      },
      max_active_orders: {
        type: DataTypes.INTEGER
      },
      current_active_orders: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      status: {
        type: DataTypes.ENUM("ACTIVE", "SUSPENDED", "INACTIVE"),
        defaultValue: "ACTIVE"
      },
      current_latitude: {
        type: DataTypes.DECIMAL
      },
      current_longitude: {
        type: DataTypes.DECIMAL
      },
      last_location_update_at: {
        type: DataTypes.DATE
      },
      is_online: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      online_since: {
        type: DataTypes.DATE
      },
      joined_at: {
        type: DataTypes.DATE
      }
    },
    {
      tableName: "delivery_partners",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      // name/phone are personal data; several partner routes have no auth, so they
      // are only read through unscoped() in the staff-only list.
      defaultScope: { attributes: { exclude: ["name", "phone"] } }
    }
  );

  DeliveryPartner.associate = (models) => {
    DeliveryPartner.hasMany(models.DeliveryAssignment, {
      foreignKey: "delivery_partner_id",
      as: "assignments"
    });
   DeliveryPartner.belongsTo(models.DeliveryZone,{
    foreignKey:"zone_id",
    as:"zone"
});


    DeliveryPartner.hasMany(models.DeliveryStatusHistory, {
      foreignKey: "delivery_partner_id",
      as: "statusHistory"
    });

    DeliveryPartner.hasMany(models.DeliveryAttempt, {
      foreignKey: "delivery_partner_id",
      as: "attempts"
    });

    DeliveryPartner.hasMany(models.DeliveryPartnerZone, {
      foreignKey: "delivery_partner_id",
      as: "partnerZones"
    });

    DeliveryPartner.belongsToMany(models.DeliveryZone, {
      through: models.DeliveryPartnerZone,
      foreignKey: "delivery_partner_id",
      otherKey: "zone_id",
      as: "zones"
    });
  };

  return DeliveryPartner;
};
