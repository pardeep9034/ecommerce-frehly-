'use strict';

// Indexes for GET /orders/admin/stats and the admin list (filter by warehouse/status, bucket by placed_at).
const INDEXES = [
  ["orders", ["placed_at"], "orders_placed_at_idx"],
  ["orders", ["warehouse_id", "placed_at"], "orders_warehouse_placed_at_idx"],
  ["orders", ["status", "created_at"], "orders_status_created_at_idx"],
  ["order_status_history", ["order_id", "new_status"], "order_status_history_order_status_idx"]
];

module.exports = {
  async up(queryInterface) {
    for (const [table, columns, name] of INDEXES) {
      await queryInterface.addIndex(table, columns, { name });
    }
  },

  async down(queryInterface) {
    for (const [table, , name] of INDEXES) {
      await queryInterface.removeIndex(table, name);
    }
  }
};
