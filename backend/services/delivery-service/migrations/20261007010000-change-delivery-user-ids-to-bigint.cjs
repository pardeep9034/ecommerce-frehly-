'use strict';

/**
 * auth-service user ids are BIGINT, but these three columns were created as UUID,
 * so a real user id cannot be stored in them:
 *   delivery_partners.user_id, delivery_assignments.assigned_by, delivery_assignment_history.changed_by
 *
 * A UUID has no BIGINT equivalent, so this refuses to run when a column holds values
 * instead of guessing a mapping. All three change in one transaction or none do.
 */
const COLUMNS = [
  ['delivery_partners', 'user_id'],
  ['delivery_assignments', 'assigned_by'],
  ['delivery_assignment_history', 'changed_by']
];

async function retype(queryInterface, Sequelize, type, transaction) {
  for (const [table, column] of COLUMNS) {
    const [{ n }] = await queryInterface.sequelize.query(
      `SELECT count(*)::int AS n FROM "${table}" WHERE "${column}" IS NOT NULL`,
      { type: Sequelize.QueryTypes.SELECT, transaction }
    );
    if (n > 0) {
      throw new Error(`${table}.${column} holds ${n} value(s) that cannot be converted to ${type}; clear or map them first`);
    }
    // USING NULL is safe here: the guard above proved there is nothing to convert.
    await queryInterface.sequelize.query(
      `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE ${type} USING NULL`,
      { transaction }
    );
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction((transaction) =>
      retype(queryInterface, Sequelize, 'BIGINT', transaction)
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction((transaction) =>
      retype(queryInterface, Sequelize, 'UUID', transaction)
    );
  }
};
