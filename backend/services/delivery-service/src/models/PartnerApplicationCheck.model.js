import { DataTypes } from "sequelize";
import { CHECK_KEYS } from "../modules/partnerApplication/partnerApplicationRules.js";

export default (sequelize) => {
  const PartnerApplicationCheck = sequelize.define(
    "PartnerApplicationCheck",
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
      check_key: {
        type: DataTypes.ENUM(...CHECK_KEYS),
        allowNull: false
      },
      done: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      done_by: {
        type: DataTypes.BIGINT
      },
      done_at: {
        type: DataTypes.DATE
      },
      note: {
        type: DataTypes.TEXT
      }
    },
    {
      tableName: "delivery_partner_application_checks",
      timestamps: false
    }
  );

  PartnerApplicationCheck.associate = (models) => {
    PartnerApplicationCheck.belongsTo(models.PartnerApplication, {
      foreignKey: "application_id",
      as: "application"
    });
  };

  return PartnerApplicationCheck;
};
