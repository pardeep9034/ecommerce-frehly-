import { referrerPolicy } from "helmet";
import { DataTypes } from "sequelize";

export default (sequelize) => {

    const Inventory = sequelize.define(
        "Inventory",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            variantId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references:{
                    model:"product_variants",
                    key:"id"
                }
            },

            stock: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },

            reservedStock: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },

            lowStockAlert: {
                type: DataTypes.INTEGER,
                defaultValue: 5
            }
        },
        {
            tableName: "inventories",
            timestamps: true
        }
    );

    Inventory.associate = (models) => {

        Inventory.hasMany(models.InventoryLog, {
            foreignKey: "inventoryId",
            as: "logs"
        });

    };

    return Inventory;
};