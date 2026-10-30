'use strict';

// Set when store staff pack a READY_FOR_ASSIGNMENT order (POST /orders/:orderId/pack). packed_at doubles as the
// "packed" flag, so there is no separate boolean to keep in step with it.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "packed_at", { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn("orders", "bag_count", { type: Sequelize.SMALLINT, allowNull: true });
    await queryInterface.addColumn("orders", "rack_label", { type: Sequelize.STRING(20), allowNull: true });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("orders", "rack_label");
    await queryInterface.removeColumn("orders", "bag_count");
    await queryInterface.removeColumn("orders", "packed_at");
  }
};
