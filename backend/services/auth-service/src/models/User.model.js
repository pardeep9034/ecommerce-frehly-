import { DataTypes } from "sequelize";
import bcrypt from "bcryptjs";

export default (sequelize) => {
    const AuthUser = sequelize.define(
        "auth_user",
        {
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true
            },

            uuid: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: true,
                defaultValue: DataTypes.UUIDV4
            },

            first_name: {
                type: DataTypes.STRING(50),
                allowNull: true
            },

            last_name: {
                type: DataTypes.STRING(50),
                allowNull: true
            },

            email: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true
            },

            phone: {
                type: DataTypes.STRING(15),
                allowNull: false,
                unique: true
            },

            password_hash: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            auth_provider: {
                type: DataTypes.ENUM(
                    "LOCAL",
                    "GOOGLE",
                    "LOCAL_GOOGLE"
                ),
                allowNull: false,
                defaultValue: "LOCAL"
            },

            google_id: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true
            },

            role: {
                type: DataTypes.ENUM(
                    "CUSTOMER",
                    "ADMIN",
                    "SUPER_ADMIN",
                    "OPS_STAFF",
                    "DELIVERY_PARTNER"
                ),
                allowNull: false,
                defaultValue: "CUSTOMER"
            },

            phone_verified: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },

            email_verified: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            profile_complete: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },

            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },

            failed_login_attempts: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },

            account_locked_until: {
                type: DataTypes.DATE,
                allowNull: true
            },

            refresh_token: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            last_login_at: {
                type: DataTypes.DATE,
                allowNull: true
            },

            last_login_ip: {
                type: DataTypes.STRING,
                allowNull: true
            },

            last_login_device: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            deleted_at: {
                type: DataTypes.DATE,
                allowNull: true
            }
        },
        {
            tableName: "auth_users",
            underscored: true,
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            hooks: {
                beforeCreate: async (user) => {
                    if (user.password_hash) {
                        user.password_hash = await bcrypt.hash(
                            user.password_hash,
                            parseInt(process.env.BCRYPT_ROUNDS, 10) || 12
                        );
                    }
                },

                beforeUpdate: async (user) => {
                    if (user.changed('password_hash')) {
                        user.password_hash = await bcrypt.hash(
                            user.password_hash,
                            parseInt(process.env.BCRYPT_ROUNDS, 10) || 12
                        );
                    }
                }
            }
        }
    );

    AuthUser.associate = (models) => {
        AuthUser.hasMany(models.AuthRefreshToken, {
            foreignKey: "user_id",
            as: "refreshTokens"
        });
        AuthUser.hasMany(models.AuthUserSession, {
            foreignKey: "user_id",
            as: "sessions"
        });
        AuthUser.hasMany(models.AuthAuditLog, {
            foreignKey: "user_id",
            as: "auditLogs"
        });
        AuthUser.hasMany(models.AuthUserAddress, {
            foreignKey: "user_id",
            as: "addresses"
        });

    };

    return AuthUser;
};
