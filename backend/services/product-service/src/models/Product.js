import { DataTypes } from "sequelize";

export default (sequelize) => {

    const Product = sequelize.define(
        "Product",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            name: {
                type: DataTypes.STRING,
                allowNull: false
            },

            slug: {
                type: DataTypes.STRING,
                unique: true
            },

            categoryId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            productType: {
                type: DataTypes.STRING
            },

            brand: {
                type: DataTypes.STRING,
                defaultValue: "Freshly"
            },

            description: {
                type: DataTypes.TEXT
            },

            isOrganic: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },

            status: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            }
        },
        {
            tableName: "products",
            timestamps: true
        }
    );

    Product.associate = (models) => {

        Product.belongsTo(models.Category, {
            foreignKey: "categoryId"
        });

        Product.hasMany(models.ProductVariant, {
            foreignKey: "productId",
            as: "variants"
        });

    };

    return Product;
};