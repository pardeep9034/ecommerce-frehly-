'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('order_addresses', 'latitude', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: true
    });

    await queryInterface.addColumn('order_addresses', 'longitude', {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('order_addresses', 'longitude');
    await queryInterface.removeColumn('order_addresses', 'latitude');
  }
};
