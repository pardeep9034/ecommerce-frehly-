'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('auth_otps', {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },

            user_id: {
                type: Sequelize.BIGINT,
                allowNull: true,
                references: {
                    model: 'auth_users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },

            code_hash: {
                type: Sequelize.TEXT,
                allowNull: false
            },

            type: {
                type: Sequelize.ENUM(
                    'SIGNUP',
                    'EMAIL_VERIFY',
                    'FORGOT_PASSWORD'
                ),
                allowNull: false
            },

            channel: {
                type: Sequelize.ENUM(
                    'SMS',
                    'EMAIL'
                ),
                allowNull: false
            },

            sent_to: {
                type: Sequelize.STRING,
                allowNull: false
            },

            attempt_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },

            request_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1
            },

            status: {
                type: Sequelize.ENUM(
                    'PENDING',
                    'USED',
                    'EXPIRED',
                    'BLOCKED'
                ),
                allowNull: false,
                defaultValue: 'PENDING'
            },

            expires_at: {
                type: Sequelize.DATE,
                allowNull: false
            },

            used_at: {
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
        await queryInterface.dropTable('auth_otps');

        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_auth_otps_type";'
        );

        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_auth_otps_channel";'
        );

        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_auth_otps_status";'
        );
    }
};