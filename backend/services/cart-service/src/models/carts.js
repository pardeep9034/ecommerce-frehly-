import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Cart = sequelize.define(
    "Cart",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true   // 🔥 one cart per user
      }
    },
    {
      tableName: "carts",
      timestamps: true,
     
    }
  );
  Cart.associate = (models) => {
  Cart.hasMany(models.CartItem, {
    foreignKey: "cartId",
    as: "items"
  });
};

  return Cart;
};