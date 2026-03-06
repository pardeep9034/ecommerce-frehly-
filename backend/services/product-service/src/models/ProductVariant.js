import { DataTypes } from "sequelize";

export default (sequelize) => {

    const ProductVariant = sequelize.define(
        "ProductVariant",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            productId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            unitType: {
                type: DataTypes.ENUM("weight", "piece", "pack"),
                allowNull: false
            },

            value: {
                type: DataTypes.FLOAT
            },

            unit: {
                type: DataTypes.STRING
            },

            price: {
                type: DataTypes.FLOAT,
                allowNull: false
            },

            mrp: {
                type: DataTypes.FLOAT
            },

            status: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            }
        },
        {
            tableName: "product_variants",
            timestamps: true
        }
    );

    ProductVariant.associate = (models) => {

        ProductVariant.belongsTo(models.Product, {
            foreignKey: "productId"
        });

    };

    return ProductVariant;
};