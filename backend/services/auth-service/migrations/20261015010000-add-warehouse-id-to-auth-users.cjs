'use strict';

// Warehouses belong to inventory-service, so this is a plain column, not a foreign key.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('auth_users', 'warehouse_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      defaultValue: null
    });
  },

  async down (queryInterface) {
    await queryInterface.removeColumn('auth_users', 'warehouse_id');
  }
};
