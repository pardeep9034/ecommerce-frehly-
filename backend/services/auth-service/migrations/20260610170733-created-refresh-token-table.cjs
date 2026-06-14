'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('auth_refresh_tokens', {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },

            user_id: {
                type: Sequelize.BIGINT,
                allowNull: false,
                references: {
                    model: 'auth_users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },

            token_hash: {
                type: Sequelize.TEXT,
                allowNull: false
            },

            family_id: {
                type: Sequelize.UUID,
                allowNull: false
            },

            device_id: {
                type: Sequelize.STRING,
                allowNull: true
            },

            user_agent: {
                type: Sequelize.TEXT,
                allowNull: true
            },

            ip_address: {
                type: Sequelize.STRING,
                allowNull: true
            },

            is_revoked: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            expires_at: {
                type: Sequelize.DATE,
                allowNull: false
            },

            revoked_at: {
                type: Sequelize.DATE,
                allowNull: true
            },

            revoke_reason: {
                type: Sequelize.TEXT,
                allowNull: true
            },

            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },

            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('auth_refresh_tokens');
    }
};