'use strict';

/**
 * order-service order ids are BIGINT (orders.id), but order_id was created as UUID in all five
 * delivery tables, so a real order id cannot be stored in them.
 *
 * A UUID has no BIGINT equivalent, so this refuses to run when a column holds values instead of
 * guessing a mapping. All five change in one transaction or none do.
 */
const TABLES = [
  'delivery_assignments',
  'delivery_assignment_history',
  'delivery_attempts',
  'delivery_handovers',
  'delivery_status_history'
];

async function retype(queryInterface, Sequelize, type, transaction) {
  for (const table of TABLES) {
    const [{ n }] = await queryInterface.sequelize.query(
      `SELECT count(*)::int AS n FROM "${table}" WHERE "order_id" IS NOT NULL`,
      { type: Sequelize.QueryTypes.SELECT, transaction }
    );
    if (n > 0) {
      throw new Error(`${table}.order_id holds ${n} value(s) that cannot be converted to ${type}; clear or map them first`);
    }
    // USING NULL is safe here: the guard above proved there is nothing to convert.
    await queryInterface.sequelize.query(
      `ALTER TABLE "${table}" ALTER COLUMN "order_id" TYPE ${type} USING NULL`,
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
