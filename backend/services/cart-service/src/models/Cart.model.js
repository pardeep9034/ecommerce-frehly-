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

      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true   // 🔥 one cart per user
      },
      coupon_code: {
        type: DataTypes.STRING,
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }

    },
    {
      tableName: "carts",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
     
    }
  );
  Cart.associate = (models) => {
  Cart.hasMany(models.CartItem, {
    foreignKey: "cart_id",
    as: "items",
    onDelete:"CASCADE",
   
  });
};

  return Cart;
};