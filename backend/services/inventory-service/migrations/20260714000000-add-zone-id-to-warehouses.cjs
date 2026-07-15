'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("warehouses", "zone_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("warehouses", "zone_id");
  },
};
