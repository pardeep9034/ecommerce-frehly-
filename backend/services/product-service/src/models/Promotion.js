import { DataTypes } from "sequelize";

export default (sequelize) => {

    const Promotion = sequelize.define(
        "Promotion",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            title: {
                type: DataTypes.STRING
            },

            type: {
                type: DataTypes.ENUM("HOT", "POPULAR", "DISCOUNT"),
                allowNull: false
            },

            discountType: {
                type: DataTypes.ENUM("PERCENT", "FLAT"),
                allowNull: true
            },

            discountValue: {
                type: DataTypes.FLOAT,
                allowNull: true
            },

            startDate: {
                type: DataTypes.DATE
            },

            endDate: {
                type: DataTypes.DATE
            },

            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },

            priority: {
                type: DataTypes.INTEGER,
                defaultValue: 1
            }
        },
        {
            tableName: "promotions",
            timestamps: true
        }
    );

    Promotion.associate = (models) => {
        Promotion.hasMany(models.PromotionItem, {
            foreignKey: "promotionId"
        });
    };

    return Promotion;
};