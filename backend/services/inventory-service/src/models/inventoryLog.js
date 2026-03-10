import { DataTypes } from "sequelize";

export default (sequelize) => {

    const InventoryLog = sequelize.define(
        "InventoryLog",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            inventoryId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            type: {
                type: DataTypes.ENUM(
                    "purchase",
                    "sale",
                    "adjustment",
                    "return"
                ),
                allowNull: false
            },

            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            previousStock: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            newStock: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            note: {
                type: DataTypes.TEXT
            }
        },
        {
            tableName: "inventory_logs",
            timestamps: true
        }
    );

    InventoryLog.associate = (models) => {

        InventoryLog.belongsTo(models.Inventory, {
            foreignKey: "inventoryId",
            as: "inventory"
        });

    };

    return InventoryLog;
};