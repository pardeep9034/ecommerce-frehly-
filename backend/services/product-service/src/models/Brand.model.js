import { DataTypes } from "sequelize";
export default (sequilize)=>{
    const Brands=sequilize.define("Brands",{
        id:{
            type:DataTypes.INTEGER,
            primaryKey:true,
            autoIncrement:true
        },
        name:{
            type:DataTypes.STRING(100),
            allowNull:false
        },
        slug:{
            type:DataTypes.STRING(100),
            allowNull:false,
            unique:true
        },
      is_active:{
        type:DataTypes.BOOLEAN,
        defaultValue:true
      },
        logo_url:{
            type:DataTypes.STRING,
            allowNull:false
        },
        description:{
            type:DataTypes.STRING(1000),
            allowNull:true
        }
       
     
    },{
        tableName:"brands",
        timestamps:true,
        createdAt:"created_at",
        updatedAt:"updated_at"
      
    });
    Brands.associate=(models)=>{
        Brands.hasMany(models.Product,{
            foreignKey: "brand_id",
            as: "products"
        });
    }
    return Brands;
}