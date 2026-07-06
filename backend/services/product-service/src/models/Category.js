import { DataTypes } from "sequelize";

export default (sequelize) => {

    const Category = sequelize.define(
        "Category",
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
            parent_id:{
                type: DataTypes.INTEGER,
                allowNull: true
            },

            image_url: {
                type: DataTypes.STRING,
                allowNull: false
            },
            description:{
             type:DataTypes.STRING,
             allowNull: true
            },
            sort_order:{
                type:DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },

            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            }
        },
        {
            tableName: "categories",
            timestamps: true,
            createdAt:"created_at",
            updatedAt:"updated_at"
        }
    );

    Category.associate = (models) => {
       Category.belongsTo(models.Category, {
        foreignKey: "parent_id",
        as: "parent"
       });
       Category.hasMany(models.Category,{
        foreignKey: "parent_id",
        as: "children"
       });
       Category.hasMany(models.Product,{
        foreignKey: "category_id",
        as: "products"
       })
    };

    return Category;
};