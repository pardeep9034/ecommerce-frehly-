'use strict';

module.exports = {
  async up(queryInterface) {
    // Serves GET /stock-reservations?status=…  (filter + newest-first) and the per-status counts.
    await queryInterface.addIndex('inventory_reservations', ['status', 'created_at'], {
      name: 'inventory_reservations_status_created_at_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('inventory_reservations', 'inventory_reservations_status_created_at_idx');
  },
};
