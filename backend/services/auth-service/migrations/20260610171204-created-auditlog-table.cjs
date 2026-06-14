'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('auth_audit_logs', {
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

            event_type: {
                type: Sequelize.ENUM(
                    'LOGIN_SUCCESS',
                    'LOGIN_FAILURE',
                    'LOGOUT',
                    'LOGOUT_ALL',
                    'PASSWORD_CHANGE',
                    'PASSWORD_RESET_REQUEST',
                    'PASSWORD_RESET_SUCCESS',
                    'ACCOUNT_LOCKED',
                    'ACCOUNT_UNLOCKED',
                    'ROLE_CHANGE',
                    'OTP_SENT',
                    'OTP_VERIFIED',
                    'TOKEN_REFRESH',
                    'TOKEN_REVOKED',
                    'SESSION_EXPIRED',
                    'PROFILE_UPDATED'
                ),
                allowNull: false
            },

            email: {
                type: Sequelize.STRING,
                allowNull: true
            },

            phone: {
                type: Sequelize.STRING(15),
                allowNull: true
            },

            ip_address: {
                type: Sequelize.STRING,
                allowNull: true
            },

            user_agent: {
                type: Sequelize.TEXT,
                allowNull: true
            },

            device_id: {
                type: Sequelize.STRING,
                allowNull: true
            },

            status: {
                type: Sequelize.ENUM(
                    'SUCCESS',
                    'FAILURE'
                ),
                allowNull: false,
                defaultValue: 'SUCCESS'
            },

            error_message: {
                type: Sequelize.TEXT,
                allowNull: true
            },

            details: {
                type: Sequelize.JSON,
                allowNull: true
            },

            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('auth_audit_logs');

        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_auth_audit_logs_event_type";'
        );

        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_auth_audit_logs_status";'
        );
    }
};