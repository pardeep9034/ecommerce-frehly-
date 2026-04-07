'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('auth_otps', {

      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'auth_users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },

      code_hash: {
        type: Sequelize.STRING,
        allowNull: false
      },

      type: {
        type: Sequelize.ENUM('SIGNUP', 'RESET'),
        allowNull: false
      },

      channel: {
        type: Sequelize.ENUM('SMS', 'EMAIL'),
        allowNull: false
      },

      sent_to: {
        type: Sequelize.STRING,
        allowNull: false
      },

      attempt_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
        defaultValue: Sequelize.NOW
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }

    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('auth_otps');
  }
};