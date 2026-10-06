import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define(
    "Setting",
    {
      key: {
        type: DataTypes.STRING(50),
        primaryKey: true
      },
      value: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      updated_by: {
        type: DataTypes.BIGINT,
        allowNull: true
      }
    },
    {
      tableName: "settings",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );
};
