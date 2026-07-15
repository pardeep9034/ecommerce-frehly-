'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // Rename existing enum type to preserve it temporarily
      await queryInterface.sequelize.query('ALTER TYPE "enum_orders_status" RENAME TO "enum_orders_status_old";', { transaction });

      // Create the new enum type with the expanded statuses
      await queryInterface.sequelize.query(
        `CREATE TYPE "enum_orders_status" AS ENUM(
          'PENDING_PAYMENT',
          'PAYMENT_FAILED',
          'PAYMENT_EXPIRED',
          'PLACED',
          'CONFIRMED',
          'READY_FOR_ASSIGNMENT',
          'ASSIGNED',
          'PICKED_UP',
          'OUT_FOR_DELIVERY',
          'HANDOVER_IN_PROGRESS',
          'DELIVERED',
          'CANCELLED',
          'DELIVERY_FAILED'
        );`,
        { transaction }
      );

      // Alter the column to use the new enum type
      await queryInterface.sequelize.query(
        'ALTER TABLE "orders" ALTER COLUMN "status" TYPE "enum_orders_status" USING "status"::text::"enum_orders_status";',
        { transaction }
      );

      // Set default to PLACED
      await queryInterface.sequelize.query(
        "ALTER TABLE \"orders\" ALTER COLUMN \"status\" SET DEFAULT 'PLACED';",
        { transaction }
      );

      // Drop the old enum type
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_status_old";', { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // Rename current enum to a temp name
      await queryInterface.sequelize.query('ALTER TYPE "enum_orders_status" RENAME TO "enum_orders_status_new";', { transaction });

      // Recreate the old enum type
      await queryInterface.sequelize.query(
        `CREATE TYPE "enum_orders_status" AS ENUM(
          'PENDING_PAYMENT',
          'PLACED',
          'CONFIRMED',
          'OUT_FOR_DELIVERY',
          'DELIVERED',
          'CANCELLED',
          'PAYMENT_FAILED',
          'PAYMENT_EXPIRED'
        );`,
        { transaction }
      );

      // Alter column back to old enum
      await queryInterface.sequelize.query(
        'ALTER TABLE "orders" ALTER COLUMN "status" TYPE "enum_orders_status" USING "status"::text::"enum_orders_status";',
        { transaction }
      );

      // Remove default (original had no default)
      await queryInterface.sequelize.query('ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;', { transaction });

      // Drop the temporary new enum type
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_status_new";', { transaction });
    });
  }
};
