import { DataTypes } from "sequelize";
import { STATUSES, VEHICLE_TYPES } from "../modules/partnerApplication/partnerApplicationRules.js";

export default (sequelize) => {
  const PartnerApplication = sequelize.define(
    "PartnerApplication",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      // Shown to people as "FR-P-" + ref_no. The sequence starts at 1001.
      ref_no: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: sequelize.literal("nextval('partner_application_ref_seq')")
      },
      // The auth-service user. One open application per user (partial unique index).
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false
      },
      // Taken from the token, never from the request body.
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(150)
      },
      preferred_zone_id: {
        type: DataTypes.BIGINT
      },
      vehicle_type: {
        type: DataTypes.ENUM(...VEHICLE_TYPES),
        allowNull: false
      },
      vehicle_number: {
        type: DataTypes.STRING(20)
      },
      source: {
        type: DataTypes.ENUM("SELF", "ADMIN"),
        allowNull: false,
        defaultValue: "SELF"
      },
      // Staff user id when source is ADMIN.
      created_by: {
        type: DataTypes.BIGINT
      },
      status: {
        type: DataTypes.ENUM(...STATUSES),
        allowNull: false,
        defaultValue: "DRAFT"
      },
      consent_at: {
        type: DataTypes.DATE
      },
      submitted_at: {
        type: DataTypes.DATE
      },
      reviewer_id: {
        type: DataTypes.BIGINT
      },
      review_started_at: {
        type: DataTypes.DATE
      },
      decided_at: {
        type: DataTypes.DATE
      },
      decided_by: {
        type: DataTypes.BIGINT
      },
      decision_reason: {
        type: DataTypes.STRING(100)
      },
      decision_note: {
        type: DataTypes.TEXT
      },
      partner_id: {
        type: DataTypes.UUID
      },
      // Optimistic concurrency for the review decisions.
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      tableName: "delivery_partner_applications",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );

  PartnerApplication.associate = (models) => {
    // No database foreign key (the zone may be deleted later); the queue shows a dash for a zone that is gone.
    PartnerApplication.belongsTo(models.DeliveryZone, {
      foreignKey: "preferred_zone_id",
      as: "preferredZone",
      constraints: false
    });

    PartnerApplication.hasMany(models.PartnerDocument, {
      foreignKey: "application_id",
      as: "documents"
    });

    PartnerApplication.hasMany(models.PartnerApplicationCheck, {
      foreignKey: "application_id",
      as: "checks"
    });

    PartnerApplication.hasMany(models.PartnerApplicationEvent, {
      foreignKey: "application_id",
      as: "events"
    });
  };

  return PartnerApplication;
};
