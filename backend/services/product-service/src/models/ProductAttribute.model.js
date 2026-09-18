import { DataTypes } from "sequelize";

export default (sequilize)=>{
const ProductAttributes=sequilize.define("ProductAttributes",{
    id:{
         type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
       
    },
    product_id:{
        type:DataTypes.INTEGER,
        allowNull: false
    },
    attribute_name:{
        type:DataTypes.STRING,
        allowNull: false
    },
    attribute_value:{
        type:DataTypes.STRING,
        allowNull: false
    },
    data_type:{
        type:DataTypes.ENUM("TEXT","NUMBER","BOOLEAN"),
        defaultValue:"TEXT"
    },
    is_filterable:{
        type:DataTypes.BOOLEAN,
        defaultValue:false
    },
    sort_order:{
        type:DataTypes.INTEGER,
        defaultValue:0
    }
    
},
{
    tableName:"product_attributes",
    timestamps:true,
    createdAt:"created_at",
    updatedAt:"updated_at"
}
);

ProductAttributes.associate=(models)=>{
    ProductAttributes.belongsTo(models.Product,{foreignKey:"product_id"});
};
return ProductAttributes;
}