import { DataTypes } from "sequelize";

export default (sequelize) => {
    const AuthRefreshToken = sequelize.define(
        "auth_refresh_token",
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

            token_hash: {
                type: DataTypes.TEXT,
                allowNull: false
            },

            family_id: {
                type: DataTypes.UUID,
                allowNull: false
            },

            device_id: {
                type: DataTypes.STRING,
                allowNull: true
            },

            user_agent: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            ip_address: {
                type: DataTypes.STRING,
                allowNull: true
            },

            is_revoked: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            expires_at: {
                type: DataTypes.DATE,
                allowNull: false
            },

            revoked_at: {
                type: DataTypes.DATE,
                allowNull: true
            },

            revoke_reason: {
                type: DataTypes.TEXT,
                allowNull: true
            }
        },
        {
            tableName: "auth_refresh_tokens",
            underscored: true,
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    );

    AuthRefreshToken.associate = (models) => {
        AuthRefreshToken.belongsTo(models.AuthUser, {
            foreignKey: "user_id",
            as: "user"
        });
    };

    return AuthRefreshToken;
};