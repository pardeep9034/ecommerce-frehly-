import { DataTypes } from "sequelize";

export default (sequelize) => {
    const AuthUserSession = sequelize.define(
        "AuthUserSession",
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

            session_id: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: true
            },

            refresh_family_id: {
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

            status: {
                type: DataTypes.ENUM(
                    "ACTIVE",
                    "EXPIRED",
                    "REVOKED"
                ),
                allowNull: false,
                defaultValue: "ACTIVE"
            },

            last_activity_at: {
                type: DataTypes.DATE,
                allowNull: true
            },

            expires_at: {
                type: DataTypes.DATE,
                allowNull: true
            },

            revoked_at: {
                type: DataTypes.DATE,
                allowNull: true
            }
        },
        {
            tableName: "auth_user_sessions",
            underscored: true,
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    );

    AuthUserSession.associate = (models) => {
        AuthUserSession.belongsTo(models.AuthUser, {
            foreignKey: "user_id",
            as: "user"
        });
    };

    return AuthUserSession;
};