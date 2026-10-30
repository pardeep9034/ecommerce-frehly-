'use strict';

/**
 * kind: RETURN_PICKUP is a rider sent to a customer to collect an approved return (order-service order_returns,
 * APPROVED). It runs the other way round: customer first, then the store, which takes the goods with the return code
 * like any other return (return_due_at is set when the rider has them).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('delivery_assignments', 'kind', {
      type: Sequelize.ENUM('DELIVERY', 'RETURN_PICKUP'),
      allowNull: false,
      defaultValue: 'DELIVERY',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('delivery_assignments', 'kind');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_delivery_assignments_kind"');
  }
};
