import { DataTypes } from "sequelize";

export default (sequelize) => {
    const AuthAuditLog = sequelize.define(
        "auth_audit_log",
        {
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true
            },

            user_id: {
                type: DataTypes.BIGINT,
                allowNull: true
            },

            event_type: {
                type: DataTypes.ENUM(
                    "LOGIN_SUCCESS",
                    "LOGIN_FAILURE",
                    "LOGOUT",
                    "LOGOUT_ALL",
                    "PASSWORD_CHANGE",
                    "PASSWORD_RESET_REQUEST",
                    "PASSWORD_RESET_SUCCESS",
                    "ACCOUNT_LOCKED",
                    "ACCOUNT_UNLOCKED",
                    "ROLE_CHANGE",
                    "OTP_SENT",
                    "OTP_VERIFIED",
                    "TOKEN_REFRESH",
                    "TOKEN_REVOKED",
                    "SESSION_EXPIRED",
                    "PROFILE_UPDATED"
                ),
                allowNull: false
            },

            email: {
                type: DataTypes.STRING,
                allowNull: true
            },

            phone: {
                type: DataTypes.STRING(15),
                allowNull: true
            },

            ip_address: {
                type: DataTypes.STRING,
                allowNull: true
            },

            user_agent: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            device_id: {
                type: DataTypes.STRING,
                allowNull: true
            },

            status: {
                type: DataTypes.ENUM(
                    "SUCCESS",
                    "FAILURE"
                ),
                allowNull: false,
                defaultValue: "SUCCESS"
            },

            error_message: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            details: {
                type: DataTypes.JSON,
                allowNull: true
            }
        },
        {
            tableName: "auth_audit_logs",
            underscored: true,
            timestamps: true,
            createdAt:"created_at",
            updatedAt:false
        }
    );

    AuthAuditLog.associate = (models) => {
        AuthAuditLog.belongsTo(models.AuthUser, {
            foreignKey: "user_id",
            as: "user"
        });
    };

    return AuthAuditLog;
};