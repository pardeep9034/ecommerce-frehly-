'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('auth_users', {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },

            uuid: {
                type: Sequelize.UUID,
                allowNull: false,
                unique: true
            },

            first_name: {
                type: Sequelize.STRING(50),
                allowNull: true
            },

            last_name: {
                type: Sequelize.STRING(50),
                allowNull: true
            },

            email: {
                type: Sequelize.STRING,
                allowNull: true,
                unique: true
            },

            phone: {
                type: Sequelize.STRING(15),
                allowNull: false,
                unique: true
            },

            password_hash: {
                type: Sequelize.TEXT,
                allowNull: true
            },

            auth_provider: {
                type: Sequelize.ENUM(
                    'LOCAL',
                    'GOOGLE',
                    'LOCAL_GOOGLE'
                ),
                allowNull: false,
                defaultValue: 'LOCAL'
            },

            google_id: {
                type: Sequelize.STRING,
                allowNull: true,
                unique: true
            },

            role: {
                type: Sequelize.ENUM(
                    'CUSTOMER',
                    'ADMIN',
                    'SUPER_ADMIN',
                    'OPS_STAFF',
                    'DELIVERY_PARTNER'
                ),
                allowNull: false,
                defaultValue: 'CUSTOMER'
            },

            phone_verified: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            email_verified: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },

            failed_login_attempts: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },

            account_locked_until: {
                type: Sequelize.DATE,
                allowNull: true
            },

            refresh_token: {
                type: Sequelize.TEXT,
                allowNull: true
            },

            last_login_at: {
                type: Sequelize.DATE,
                allowNull: true
            },

            last_login_ip: {
                type: Sequelize.STRING,
                allowNull: true
            },

            last_login_device: {
                type: Sequelize.TEXT,
                allowNull: true
            },

            deleted_at: {
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
        await queryInterface.dropTable('auth_users');

        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_auth_users_auth_provider";'
        );

        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_auth_users_role";'
        );
    }
};