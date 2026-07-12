import { DataTypes } from "sequelize";

export default (sequelize) => {
  const OrderAddress = sequelize.define(
    "OrderAddresses",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      order_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true
      },
      full_name: {
        type: DataTypes.STRING(255)
      },
      phone: {
        type: DataTypes.STRING(20)
      },
      address_line_1: {
        type: DataTypes.STRING(255)
      },
      address_line_2: {
        type: DataTypes.STRING(255)
      },
      landmark: {
        type: DataTypes.STRING(255)
      },
      city: {
        type: DataTypes.STRING(100)
      },
      state: {
        type: DataTypes.STRING(100)
      },
      postal_code: {
        type: DataTypes.STRING(20)
      },
      country: {
        type: DataTypes.STRING(100)
      }
    },
    {
      tableName: "order_addresses",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false
    }
  );

  OrderAddress.associate = (models) => {
    OrderAddress.belongsTo(models.Order, {
      foreignKey: "order_id",
      as: "order"
    });
  };

  return OrderAddress;
};
