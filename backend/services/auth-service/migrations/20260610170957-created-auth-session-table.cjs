'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('auth_user_sessions', {
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

            session_id: {
                type: Sequelize.UUID,
                allowNull: false,
                unique: true
            },

            refresh_family_id: {
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

            status: {
                type: Sequelize.ENUM(
                    'ACTIVE',
                    'EXPIRED',
                    'REVOKED'
                ),
                allowNull: false,
                defaultValue: 'ACTIVE'
            },

            last_activity_at: {
                type: Sequelize.DATE,
                allowNull: true
            },

            expires_at: {
                type: Sequelize.DATE,
                allowNull: true
            },

            revoked_at: {
                type: Sequelize.DATE,
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
        await queryInterface.dropTable('auth_user_sessions');

        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_auth_user_sessions_status";'
        );
    }
};