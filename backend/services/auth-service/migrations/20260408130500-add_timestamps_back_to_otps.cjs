'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Safely add the created_at and updated_at columns back to the auth_otps table
    // IF and only if they were removed in your previous migration
    await queryInterface.addColumn('auth_otps', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
    
    await queryInterface.addColumn('auth_otps', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('auth_otps', 'created_at');
    await queryInterface.removeColumn('auth_otps', 'updated_at');
  }
};
