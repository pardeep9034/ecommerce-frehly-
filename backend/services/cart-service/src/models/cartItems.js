import { DataTypes } from "sequelize";

export default (sequelize) => {
  const CartItem = sequelize.define(
    "CartItem",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      cart_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      variant_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
    },
    {
      tableName: "cart_items",
      timestamps: true,
      createdAt:"created_at",
      updatedAt:"updated_at"
    }
  );
CartItem.associate = (models) => {
  CartItem.belongsTo(models.Cart, {
    foreignKey: "cart_id",
    as:"cart"
  });
};


  return CartItem;
};