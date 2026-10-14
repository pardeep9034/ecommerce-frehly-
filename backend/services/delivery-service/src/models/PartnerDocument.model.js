import { DataTypes } from "sequelize";
import { DOC_TYPES } from "../modules/partnerApplication/partnerApplicationRules.js";

export default (sequelize) => {
  const PartnerDocument = sequelize.define(
    "PartnerDocument",
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
        type: DataTypes.ENUM(...DOC_TYPES),
        allowNull: false
      },
      // "Not uploaded" is the absence of a row; "to check" is UPLOADED on a submitted application.
      status: {
        type: DataTypes.ENUM("UPLOADED", "VERIFIED", "REJECTED"),
        allowNull: false,
        defaultValue: "UPLOADED"
      },
      // applications/<application id>/<type>-<uuid>.<ext> inside the storage directory.
      file_key: {
        type: DataTypes.STRING,
        allowNull: false
      },
      mime: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      size_bytes: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      sha256: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      // Never the full number (D8): a masked form for display and a keyed hash for duplicate detection.
      number_masked: {
        type: DataTypes.STRING(30)
      },
      number_hmac: {
        type: DataTypes.STRING(64)
      },
      // Licence only.
      expiry_date: {
        type: DataTypes.DATEONLY
      },
      verified_by: {
        type: DataTypes.BIGINT
      },
      verified_at: {
        type: DataTypes.DATE
      },
      reject_reason: {
        type: DataTypes.TEXT
      },
      uploaded_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: "delivery_partner_documents",
      timestamps: false,
      // The file location, its hash and the number hash are internal; read them only through unscoped().
      defaultScope: { attributes: { exclude: ["file_key", "sha256", "number_hmac"] } }
    }
  );

  PartnerDocument.associate = (models) => {
    PartnerDocument.belongsTo(models.PartnerApplication, {
      foreignKey: "application_id",
      as: "application"
    });
  };

  return PartnerDocument;
};
