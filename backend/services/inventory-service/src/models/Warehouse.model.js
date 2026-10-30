import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Warehouse = sequelize.define(
    "Warehouse",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      zone_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false,
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false,
      },
      contact_person: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      contact_phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      operational_status: {
        type: DataTypes.ENUM("OPEN", "PAUSED", "MAINTENANCE", "SETTING_UP"),
        allowNull: false,
        defaultValue: "OPEN",
      },
      pincode: { type: DataTypes.STRING(6), allowNull: true },
      // Unset = open all day. A close time before the open time runs past midnight.
      store_open_time: { type: DataTypes.TIME, allowNull: true },
      store_close_time: { type: DataTypes.TIME, allowNull: true },
      pack_by_minutes: { type: DataTypes.INTEGER, allowNull: true },
      // While PAUSED: customers see the reason; past paused_until the store counts as open again (null = until reopened).
      pause_reason: { type: DataTypes.STRING(255), allowNull: true },
      paused_until: { type: DataTypes.DATE, allowNull: true },
      maintenance_message: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      tableName: "warehouses",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Warehouse;
};
