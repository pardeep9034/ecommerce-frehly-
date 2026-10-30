'use strict';

// Customer returns (asked for after delivery): REQUESTED -> REJECTED (final), CLOSED (approved, no pickup: refunded
// on approval) or APPROVED (a rider collects it, then IN_TRANSIT -> RECEIVED -> CLOSED like any other return).
// photo: the customer's photo, in the row so it is backed up with it (the model leaves it out of every read).
// reject_reason is for staff only. sent_variant_id: on a wrong item, what was actually sent (its stock comes out).
// The enum values are added in place (ADD VALUE), so down leaves them: Postgres cannot drop one enum value.
module.exports = {
  async up(queryInterface, Sequelize) {
    for (const value of ["REQUESTED", "APPROVED", "REJECTED"]) {
      await queryInterface.sequelize.query(`ALTER TYPE "enum_order_returns_status" ADD VALUE IF NOT EXISTS '${value}'`);
    }
    await queryInterface.addColumn("order_returns", "photo", { type: Sequelize.BLOB, allowNull: true });
    await queryInterface.addColumn("order_returns", "reject_reason", { type: Sequelize.STRING(20), allowNull: true });
    await queryInterface.addColumn("order_returns", "sent_variant_id", { type: Sequelize.BIGINT, allowNull: true });
    await queryInterface.addColumn("order_returns", "reviewed_by", { type: Sequelize.BIGINT, allowNull: true });
    await queryInterface.addColumn("order_returns", "reviewed_at", { type: Sequelize.DATE, allowNull: true });
  },

  async down(queryInterface) {
    for (const column of ["reviewed_at", "reviewed_by", "sent_variant_id", "reject_reason", "photo"]) {
      await queryInterface.removeColumn("order_returns", column);
    }
  }
};
