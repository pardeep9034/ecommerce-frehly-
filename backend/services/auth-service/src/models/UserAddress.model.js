import { DataTypes } from "sequelize";

export default (sequelize) => {
    const AuthUserAddress = sequelize.define(
        "AuthUserAddress",
        {
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: DataTypes.BIGINT,
                allowNull: false
            },
            address_type: {
                type: DataTypes.STRING(20),
                allowNull: false
            },
            full_name: {
                type: DataTypes.STRING(150),
                allowNull: false
            },
            phone: {
                type: DataTypes.STRING(15),
                allowNull: false
            },
            address_line_1: {
                type: DataTypes.STRING(255),
                allowNull: false
            },
            address_line_2: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            landmark: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            city: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            state: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            country: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            postal_code: {
                type: DataTypes.STRING(20),
                allowNull: false
            },
            latitude: {
                type: DataTypes.DECIMAL(10, 8),
                allowNull: true
            },
            longitude: {
                type: DataTypes.DECIMAL(11, 8),
                allowNull: true
            },
            delivery_instructions: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            is_default: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            }
        },
        {
            tableName: "user_addresses",
            underscored: true,
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    );

    AuthUserAddress.associate = (models) => {
        AuthUserAddress.belongsTo(models.AuthUser, {
            foreignKey: "user_id",
            as: "user"
        });
    };

    return AuthUserAddress;
};
