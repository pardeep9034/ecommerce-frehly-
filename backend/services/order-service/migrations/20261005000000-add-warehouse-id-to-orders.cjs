'use strict';

// warehouse_id is a plain column (no FK): warehouses are owned by inventory-service.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "warehouse_id", {
      type: Sequelize.BIGINT,
      allowNull: true
    });
    await queryInterface.addIndex("orders", ["warehouse_id"], { name: "orders_warehouse_id_idx" });

    // Backfill old orders from the warehouse their stock was reserved in (inventory_reservations.order_id) (same database; skipped if the table isn't there).
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF to_regclass('inventory_reservations') IS NOT NULL THEN
          UPDATE orders o SET warehouse_id = r.warehouse_id
          FROM (
            SELECT DISTINCT ON (order_id) order_id, warehouse_id
            FROM inventory_reservations
            WHERE warehouse_id IS NOT NULL
            ORDER BY order_id, id
          ) r
          WHERE r.order_id = o.id AND o.warehouse_id IS NULL;
        END IF;
      END $$;
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("orders", "orders_warehouse_id_idx");
    await queryInterface.removeColumn("orders", "warehouse_id");
  }
};
