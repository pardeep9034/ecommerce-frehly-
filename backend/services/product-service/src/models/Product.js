import { DataTypes } from "sequelize";

export default (sequelize) => {

    const Product = sequelize.define(
        "Products",
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
                allowNull: false,
                unique: true
            },

            category_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            product_type_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            brand_id: {
                type: DataTypes.INTEGER,
                allowNull: false,

            },

            description: {
                type: DataTypes.TEXT
            },
            short_description:{
                type: DataTypes.STRING(500),
                allowNull: false
            },

            is_organic: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            is_featured:{
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            sort_order:{
                type: DataTypes.INTEGER,
                defaultValue: 0
            },

            status: {
                type: DataTypes.ENUM("DRAFT","ACTIVE","INACTIVE","ARCHIVED"),
               defaultValue: "DRAFT"
            }
        },
        {
            tableName: "products",
            timestamps: true,
            createdAt:"created_at",
            updatedAt:"updated_at"
        }
    );

    Product.associate = (models) => {

        Product.belongsTo(models.Category, {
            foreignKey: "category_id",
            as: "category"
        });

        Product.belongsTo(models.Brand, {
            foreignKey: "brand_id",
            as: "brand"
        });
        Product.belongsTo(models.ProductType,
            {foreignKey:"product_type_id",
                as:"productType"
            }
        )

        Product.hasMany(models.ProductVariant, {
            foreignKey: "product_id",
            as: "variants"
        });
        Product.hasMany(models.ProductImage, {
            foreignKey: "product_id",
            as: "images"
        });

    };

    return Product;
};