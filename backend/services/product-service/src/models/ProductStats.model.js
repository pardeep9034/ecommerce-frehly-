import { DataTypes } from "sequelize";

export default (sequelize) => {

    const ProductStats = sequelize.define(
        "ProductStats",
        {
            productId: {
                type: DataTypes.INTEGER,
                primaryKey: true
            },

            viewsCount: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },

            purchaseCount: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            }
        },
        {
            tableName: "product_stats",
            timestamps: true
        }
    );

    return ProductStats;
};