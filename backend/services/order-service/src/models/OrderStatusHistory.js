import { DataTypes } from "sequelize";

export default (sequelize) => {
  const OrderStatusHistory = sequelize.define(
    "OrderStatusHistory",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      order_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      old_status: {
        type: DataTypes.STRING(50)
      },
      new_status: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      changed_by: {
        type: DataTypes.BIGINT
      },
      remarks: {
        type: DataTypes.TEXT
      }
    },
    {
      tableName: "order_status_history",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false
    }
  );

  OrderStatusHistory.associate = (models) => {
    OrderStatusHistory.belongsTo(models.Order, {
      foreignKey: "order_id",
      as: "order"
    });
  };

  return OrderStatusHistory;
};
