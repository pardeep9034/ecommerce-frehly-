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
                unique: true
            },

            image: {
                type: DataTypes.TEXT
            },

            status: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            }
        },
        {
            tableName: "categories",
            timestamps: true
        }
    );

    Category.associate = (models) => {
        Category.hasMany(models.Product, {
            foreignKey: "categoryId"
        });
    };

    return Category;
};