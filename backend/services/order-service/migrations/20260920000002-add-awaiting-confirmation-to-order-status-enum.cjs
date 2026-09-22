'use strict';

module.exports = {
  async up(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // 1. Remove the existing default before changing the enum type.
      //    The current default still references the old enum type.
      await queryInterface.sequelize.query(
        'ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;',
        { transaction }
      );

      // 2. Rename the existing enum type temporarily
      await queryInterface.sequelize.query(
        'ALTER TYPE "enum_orders_status" RENAME TO "enum_orders_status_old";',
        { transaction }
      );

      // 3. Create the new enum with the additional status
      await queryInterface.sequelize.query(
        `CREATE TYPE "enum_orders_status" AS ENUM(
          'PENDING_PAYMENT',
          'PAYMENT_FAILED',
          'PAYMENT_EXPIRED',
          'PLACED',
          'CONFIRMED',
          'READY_FOR_ASSIGNMENT',
          'AWAITING_CUSTOMER_CONFIRMATION',
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

      // 4. Change the column from the old enum to the new enum
      await queryInterface.sequelize.query(
        `ALTER TABLE "orders"
         ALTER COLUMN "status"
         TYPE "enum_orders_status"
         USING "status"::text::"enum_orders_status";`,
        { transaction }
      );

      // 5. Set the new default
      await queryInterface.sequelize.query(
        `ALTER TABLE "orders"
         ALTER COLUMN "status"
         SET DEFAULT 'PLACED';`,
        { transaction }
      );

      // 6. Remove the old enum type
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_orders_status_old";',
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // 1. Remove the current default before changing the enum type
      await queryInterface.sequelize.query(
        'ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;',
        { transaction }
      );

      // 2. Rename the current enum temporarily
      await queryInterface.sequelize.query(
        'ALTER TYPE "enum_orders_status" RENAME TO "enum_orders_status_new";',
        { transaction }
      );

      // 3. Recreate the previous enum
      //    This removes AWAITING_CUSTOMER_CONFIRMATION
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

      // 4. Change the column back to the previous enum
      await queryInterface.sequelize.query(
        `ALTER TABLE "orders"
         ALTER COLUMN "status"
         TYPE "enum_orders_status"
         USING "status"::text::"enum_orders_status";`,
        { transaction }
      );

      // 5. Restore the previous default
      await queryInterface.sequelize.query(
        `ALTER TABLE "orders"
         ALTER COLUMN "status"
         SET DEFAULT 'PLACED';`,
        { transaction }
      );

      // 6. Remove the temporary enum
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_orders_status_new";',
        { transaction }
      );
    });
  }
};