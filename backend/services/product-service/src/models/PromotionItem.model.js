import { DataTypes } from "sequelize";

export default (sequelize) => {

    const PromotionItem = sequelize.define(
        "PromotionItem",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            promotionId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            productId: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            variantId: {
                type: DataTypes.INTEGER,
                allowNull: true
            }
        },
        {
            tableName: "promotion_items",
            timestamps: true
        }
    );

    PromotionItem.associate = (models) => {

        PromotionItem.belongsTo(models.Promotion, {
            foreignKey: "promotionId"
        });

        PromotionItem.belongsTo(models.Product, {
            foreignKey: "productId"
        });

        PromotionItem.belongsTo(models.ProductVariant, {
            foreignKey: "variantId"
        });
    };

    return PromotionItem;
};