import { DataTypes } from "sequelize";
export default (sequelize)=>{
    const ProductType = sequelize.define(
        "ProductType",
        {
            id:{
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name:{
                type: DataTypes.STRING,
                allowNull: false
            },
            code:{
                type: DataTypes.STRING,
                allowNull: false,
                unique:true
            },
            is_active:{
                type: DataTypes.BOOLEAN,
                defaultValue: true
            }
        },
        {
            tableName: "product_types",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    );
    ProductType.associate=models=>{
        ProductType.hasMany(models.Product,{
            foreignKey: "product_type_id",
            as: "products"
        });
    }
    return ProductType;
}