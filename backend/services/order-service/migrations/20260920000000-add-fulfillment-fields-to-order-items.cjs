'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("order_items", "status", {
      type: Sequelize.ENUM("PENDING", "READY", "NOT_AVAILABLE"),
      allowNull: false,
      defaultValue: "PENDING"
    });

    await queryInterface.addColumn("order_items", "admin_remarks", {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn("order_items", "refund_amount", {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn("order_items", "refunded_at", {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn("order_items", "reservation_id", {
      type: Sequelize.BIGINT,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("order_items", "reservation_id");
    await queryInterface.removeColumn("order_items", "refunded_at");
    await queryInterface.removeColumn("order_items", "refund_amount");
    await queryInterface.removeColumn("order_items", "admin_remarks");
    await queryInterface.removeColumn("order_items", "status");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_order_items_status";');
  }
};
