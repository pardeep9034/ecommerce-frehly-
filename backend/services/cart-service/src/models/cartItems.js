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

      cartId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      productId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      variantId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },

      priceSnapshot: {
        type: DataTypes.FLOAT,
        allowNull: false
      }
    },
    {
      tableName: "cart_items",
      timestamps: true,
      indexes: [
        {
          name: "idx_cartId",
          fields: ["cartId"]
        },
        {
          name: "idx_product_variant",
          fields: ["productId", "variantId"]
        },
        {
          name: "idx_cart_product",
          fields: ["cartId", "productId", "variantId"],
          unique: true   
        }
      ]
    }
  );
CartItem.associate = (models) => {
  CartItem.belongsTo(models.Cart, {
    foreignKey: "cartId"
  });
};


  return CartItem;
};