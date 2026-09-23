'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "idempotency_key", {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX "orders_user_id_idempotency_key_unique"
       ON "orders" ("user_id", "idempotency_key")
       WHERE "idempotency_key" IS NOT NULL;`
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "orders_user_id_idempotency_key_unique";'
    );
    await queryInterface.removeColumn("orders", "idempotency_key");
  }
};
