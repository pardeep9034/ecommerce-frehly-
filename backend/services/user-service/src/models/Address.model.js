import { DataTypes } from "sequelize";

export default (sequelize) => {
    const Address = sequelize.define(
        "Address",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            userId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            fullName: DataTypes.STRING,
            phone: DataTypes.STRING,
            pincode: DataTypes.STRING,
            state: DataTypes.STRING,
            city: DataTypes.STRING,
            addressLine1: DataTypes.STRING,
            addressLine2: DataTypes.STRING,
            landmark: DataTypes.STRING,

            addressType: {
                type: DataTypes.ENUM("HOME", "WORK", "OTHER")
            },

            isDefault: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        },
        {
            tableName: "addresses",
            timestamps: true,

            // 🔥 INDEX DEFINITION (for clarity)
            indexes: [
                {
                    name: "idx_userId",
                    fields: ["userId"]
                },
                {
                    name: "idx_user_default",
                    fields: ["userId", "isDefault"]
                }
            ]
        }
    );

    return Address;
};