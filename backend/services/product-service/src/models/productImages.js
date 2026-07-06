import { DataTypes } from "sequelize";

export default (sequelize)=>{
    const ProductImage = sequelize.define(
        "ProductImage",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            product_id:{
                type: DataTypes.INTEGER,
                allowNull: false
            },
            variant_id:{
                type: DataTypes.INTEGER,
                allowNull: true
            },

            image_url: {
                type: DataTypes.STRING,
                allowNull: false
            },
            public_id:{
                type: DataTypes.STRING
            },
            
            alt_text: {
                type: DataTypes.STRING
            },
            sort_order: {
                type: DataTypes.INTEGER,
                defaultValue: 0
             
            },
            is_primary: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        },
        {
            tableName: "product_images",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    );
    ProductImage.associate = (models) => {
        ProductImage.belongsTo(models.Product, {
            foreignKey: "product_id",
            as: "product"
        });
        ProductImage.belongsTo(models.ProductVariant, {
            foreignKey: "variant_id",
            as: "variant"
        });
    };
    return ProductImage;
}   