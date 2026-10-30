'use strict';

/**
 * Goods a rider owes the store: return_due_at is set when an assignment ends with goods still on the rider (a failed
 * drop, or items turned away at the door) and returned_at when the store takes them back with the rider's return code.
 * While one is open the rider gets no new orders. return_flagged_at: the store was told it is overdue (2 h), once.
 * Assignments finished before this migration have no return_due_at, so they never block anyone.
 * door_photo_key: the rider's photo of what was turned away (private storage, like partner documents).
 * delivery_attempts.reason_code: the failure reason's code (REFUSED ends retries); failure_reason stays the text shown.
 */
const TABLE = 'delivery_assignments';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(TABLE, 'return_due_at', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn(TABLE, 'returned_at', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn(TABLE, 'return_flagged_at', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn(TABLE, 'door_photo_key', { type: Sequelize.STRING(255), allowNull: true });
    await queryInterface.sequelize.query(
      `CREATE INDEX delivery_assignments_open_returns ON ${TABLE} (delivery_partner_id) WHERE return_due_at IS NOT NULL AND returned_at IS NULL`
    );
    await queryInterface.addColumn('delivery_attempts', 'reason_code', { type: Sequelize.STRING(30), allowNull: true });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('delivery_attempts', 'reason_code');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS delivery_assignments_open_returns');
    await queryInterface.removeColumn(TABLE, 'door_photo_key');
    await queryInterface.removeColumn(TABLE, 'return_flagged_at');
    await queryInterface.removeColumn(TABLE, 'returned_at');
    await queryInterface.removeColumn(TABLE, 'return_due_at');
  }
};
