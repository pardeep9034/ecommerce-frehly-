import { DataTypes } from "sequelize";

export default (sequelize) => {

    const RefreshToken = sequelize.define(
        "refresh_tokens",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            token_hash: {
                type: DataTypes.STRING,
                allowNull: false
            },

            expires_at: {
                type: DataTypes.DATE,
                allowNull: false
            },

            is_revoked: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            device_id: {
                type: DataTypes.STRING,
                allowNull: true
            },

            user_agent: {
                type: DataTypes.STRING,
                allowNull: true
            },

            family_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false
            }
        },
        {
            timestamps: true,      // creates createdAt, updatedAt
            tableName: "refresh_tokens",
            indexes: [
                {
                    fields: ["user_id"]
                },
                {
                    fields: ["token_hash"]
                },
                {
                    fields: ["family_id"]
                }
            ]
        }
    );

    return RefreshToken;
};
