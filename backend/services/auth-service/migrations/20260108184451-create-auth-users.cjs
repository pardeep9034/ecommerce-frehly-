'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('auth_users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      first_name: Sequelize.STRING(50),
      last_name: Sequelize.STRING(50),

      email: {
        type: Sequelize.STRING,
        unique: true
      },

      phone: {
        type: Sequelize.STRING(15),
        allowNull: false,
        unique: true
      },

      password: Sequelize.STRING,

      otp_hash: Sequelize.STRING,
      otp_type: Sequelize.ENUM('signup', 'email_verify', 'forgot_password'),
      otp_expiry: Sequelize.DATE,

      otp_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },

      otp_send_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },

      last_otp_sent_at: Sequelize.DATE,

      role: {
        type: Sequelize.ENUM('customer', 'admin', 'vendor'),
        defaultValue: 'customer'
      },

      refresh_token: Sequelize.STRING,
      refresh_token_expiry: Sequelize.DATE,

      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },

      phone_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },

      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },

      last_login_at: Sequelize.DATE,

      login_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },

      lock_until: Sequelize.DATE,

      deleted_at: Sequelize.DATE,

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('auth_users');
  }
};
