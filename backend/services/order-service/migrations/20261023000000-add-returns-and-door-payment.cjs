'use strict';

// Returns: RETURNED_TO_STORE (a failed delivery's goods are back at the store), one order_returns row per returned
// item, and what the rider collected at the door (cash or UPI) on a COD order.
// The enum value is added in place (ADD VALUE), so down leaves it: Postgres cannot drop one enum value.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`ALTER TYPE "enum_orders_status" ADD VALUE IF NOT EXISTS 'RETURNED_TO_STORE'`);

    await queryInterface.createTable("order_returns", {
      id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
      order_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "orders", key: "id" }, onDelete: "CASCADE" },
      order_item_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: "order_items", key: "id" }, onDelete: "CASCADE" },
      quantity: { type: Sequelize.DECIMAL(12, 3), allowNull: false },
      source: { type: Sequelize.ENUM("FAILED_DELIVERY", "DOORSTEP", "CUSTOMER"), allowNull: false },
      reason: { type: Sequelize.STRING(30), allowNull: false },
      note: { type: Sequelize.TEXT },
      // The delivery assignment that carried the goods back (delivery-service, so no FK). Its door photo lives there.
      assignment_id: { type: Sequelize.UUID },
      status: { type: Sequelize.ENUM("IN_TRANSIT", "RECEIVED", "CLOSED"), allowNull: false },
      restock_qty: { type: Sequelize.DECIMAL(12, 3) },
      write_off_qty: { type: Sequelize.DECIMAL(12, 3) },
      refund_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      // NOT_NEEDED: nothing was charged for it (COD, not collected). DUE: paid in cash, refunded outside the system.
      refund_status: { type: Sequelize.ENUM("PENDING", "SENT", "DUE", "FAILED", "NOT_NEEDED"), allowNull: false, defaultValue: "PENDING" },
      refund_ref: { type: Sequelize.STRING(100) },
      received_at: { type: Sequelize.DATE },
      inspected_by: { type: Sequelize.BIGINT },
      inspected_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
    });
    await queryInterface.addIndex("order_returns", ["order_id"]);
    await queryInterface.addIndex("order_returns", ["status"]);

    await queryInterface.addColumn("orders", "collected_amount", { type: Sequelize.DECIMAL(12, 2), allowNull: true });
    await queryInterface.addColumn("orders", "collected_method", { type: Sequelize.STRING(10), allowNull: true });
    await queryInterface.addColumn("orders", "collected_at", { type: Sequelize.DATE, allowNull: true });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("orders", "collected_at");
    await queryInterface.removeColumn("orders", "collected_method");
    await queryInterface.removeColumn("orders", "collected_amount");
    await queryInterface.dropTable("order_returns");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_order_returns_source"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_order_returns_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_order_returns_refund_status"');
  }
};
