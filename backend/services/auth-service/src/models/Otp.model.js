import { DataTypes } from "sequelize";

export default (sequelize) => {
    const AuthOtp = sequelize.define(
        "auth_otp",
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

            code_hash: {
                type: DataTypes.TEXT,
                allowNull: false
            },

            type: {
                type: DataTypes.ENUM(
                    "SIGNUP",
                    "EMAIL_VERIFY",
                    "FORGOT_PASSWORD"
                ),
                allowNull: false
            },

            channel: {
                type: DataTypes.ENUM(
                    "SMS",
                    "EMAIL"
                ),
                allowNull: false
            },

            sent_to: {
                type: DataTypes.STRING,
                allowNull: false
            },

            attempt_count: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },

            request_count: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1
            },

            status: {
                type: DataTypes.ENUM(
                    "PENDING",
                    "USED",
                    "EXPIRED",
                    "BLOCKED"
                ),
                allowNull: false,
                defaultValue: "PENDING"
            },

            expires_at: {
                type: DataTypes.DATE,
                allowNull: false
            },

            used_at: {
                type: DataTypes.DATE,
                allowNull: true
            }
        },
        {
            tableName: "auth_otps",
            underscored: true,
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    );

    AuthOtp.associate = (models) => {
        AuthOtp.belongsTo(models.AuthUser, {
            foreignKey: "user_id",
            as: "user"
        });
    };

    return AuthOtp;
};