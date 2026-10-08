'use strict';

/**
 * delivery_assignment_history and delivery_handovers are append-only: their models set
 * updatedAt: false, so nothing writes updated_at. The column is NOT NULL with no default,
 * so every insert through the model fails. Drop it.
 */
const TABLES = ['delivery_assignment_history', 'delivery_handovers'];

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const table of TABLES) {
        await queryInterface.removeColumn(table, 'updated_at', { transaction });
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const table of TABLES) {
        await queryInterface.addColumn(table, 'updated_at', { type: Sequelize.DATE, allowNull: true }, { transaction });
        // Rows are never changed after insert, so created_at is the right value to restore.
        await queryInterface.sequelize.query(`UPDATE "${table}" SET "updated_at" = "created_at"`, { transaction });
        await queryInterface.sequelize.query(`ALTER TABLE "${table}" ALTER COLUMN "updated_at" SET NOT NULL`, { transaction });
      }
    });
  }
};
