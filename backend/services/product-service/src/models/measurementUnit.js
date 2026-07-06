import { DataTypes } from "sequelize";

export default (Sequelize) => {
    const MeasurementUnit = Sequelize.define(
        "MeasurementUnit",
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
            code: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            },
            category:{
                type:DataTypes.ENUM("WEIGHT","VOLUME","COUNT","PACKAGING"),
                allowNull:false
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            }
        },
        {
            tableName: "measurement_units",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    );
    MeasurementUnit.associate = (models) => {
        MeasurementUnit.hasMany(models.ProductVariant,{
            foreignKey: "measurement_unit_id",
            as: "variants"
        });
    };
    return MeasurementUnit;
}