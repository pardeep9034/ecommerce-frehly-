'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const addColumnIfNotExists = async (column, definition) => {
      try {
        await queryInterface.addColumn('auth_users', column, definition);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
        console.log(`Column ${column} already exists, skipping...`);
      }
    };

    // 1. Add new columns safely
    await addColumnIfNotExists('force_password_change', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await addColumnIfNotExists('failed_login_attempts', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await addColumnIfNotExists('account_locked_until', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await addColumnIfNotExists('last_login_ip', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('last_login_device', {
      type: Sequelize.STRING,
      allowNull: true
    });

    
    await queryInterface.changeColumn('auth_users', 'role', {
      type: Sequelize.ENUM('CUSTOMER', 'ADMIN', 'OPS_STAFF', 'VENDOR'),
      defaultValue: 'CUSTOMER'
    });
  },

  async down (queryInterface, Sequelize) {
    // Reverting changes would involve multi-step process if we want to be safe.
  }
};
