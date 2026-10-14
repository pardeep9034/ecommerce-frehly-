import { DataTypes } from "sequelize";
import { EVENT_TYPES } from "../modules/partnerApplication/partnerApplicationRules.js";

export default (sequelize) => {
  const PartnerApplicationEvent = sequelize.define(
    "PartnerApplicationEvent",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      application_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM(...EVENT_TYPES),
        allowNull: false
      },
      actor_id: {
        type: DataTypes.BIGINT
      },
      actor_role: {
        type: DataTypes.STRING(30)
      },
      // The applicant's status timeline shows only the events marked true.
      visible_to_applicant: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      payload: {
        type: DataTypes.JSONB
      }
    },
    {
      tableName: "delivery_partner_application_events",
      timestamps: true,
      createdAt: "created_at",
      // Append-only log: no updated_at, like the other delivery history tables.
      updatedAt: false
    }
  );

  PartnerApplicationEvent.associate = (models) => {
    PartnerApplicationEvent.belongsTo(models.PartnerApplication, {
      foreignKey: "application_id",
      as: "application"
    });
  };

  return PartnerApplicationEvent;
};
