import { DataTypes } from "sequelize";

export default (sequelize) => {

    const ProductVariant = sequelize.define(
        "ProductVariants",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            product_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

           sku:{
            type:DataTypes.STRING,
            allowNull:false,
            unique:true
           },
           barcode:{
            type:DataTypes.STRING,
            unique:true
           },
           quantity:{
            type:DataTypes.INTEGER,
            allowNull:false
           },
           
           measurement_unit_id:{
            type:DataTypes.INTEGER,
            allowNull:false
           },
          

            price: {
                type: DataTypes.FLOAT,
                allowNull: false
            },

            mrp: {
                type: DataTypes.FLOAT,
                allowNull:false
            },

            status: {
                type: DataTypes.ENUM("ACTIVE","INACTIVE","ARCHIVED"),
                allowNull:false
                
            },
            sort_order:{
                type:DataTypes.INTEGER,
                defaultValue: 0
            }
        },
        {
            tableName: "product_variants",
            timestamps: true,
            createdAt:"created_at",
            updatedAt:"updated_at"
        }
    );

    ProductVariant.associate = (models) => {

        ProductVariant.belongsTo(models.Product, {
            foreignKey: "product_id",
            as: "product"
        });
        ProductVariant.belongsTo(models.MeasurementUnit,{foreignKey:"measurement_unit_id",as:"measurementUnit"})
        ProductVariant.hasMany(models.ProductImage, {
            foreignKey: "variant_id",
            as: "images"
        });
        

    };

    return ProductVariant;
};