'use strict';

/**
 * Aligns columns and PostgreSQL enum types with the delivery Sequelize models.
 *
 * The existing UUID/BIGINT mismatches for order_id and assigned_by are not
 * changed here: converting UUID data to BIGINT requires an explicit data
 * mapping and cannot be done safely with a generic cast.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('delivery_partners', 'zone_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('delivery_partners', 'current_active_orders', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });

    await queryInterface.sequelize.query(
      'CREATE TYPE "enum_delivery_partners_status" AS ENUM (\'ACTIVE\', \'SUSPENDED\', \'INACTIVE\');'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "delivery_partners" ALTER COLUMN "status" TYPE "enum_delivery_partners_status" USING "status"::"enum_delivery_partners_status";'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "delivery_partners" ALTER COLUMN "status" SET DEFAULT \'ACTIVE\';'
    );

    await queryInterface.addColumn('delivery_assignment_history', 'assignment_id', {
      type: Sequelize.UUID,
      allowNull: false
    });
    await queryInterface.addColumn('delivery_assignment_history', 'action', {
      type: Sequelize.ENUM('ASSIGNED', 'REASSIGNED', 'CANCELLED', 'COMPLETED'),
      allowNull: true
    });

    await queryInterface.addColumn('delivery_handovers', 'assignment_id', {
      type: Sequelize.UUID,
      allowNull: true
    });
    await queryInterface.addColumn('delivery_handovers', 'handover_latitude', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: true
    });
    await queryInterface.addColumn('delivery_handovers', 'handover_longitude', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: true
    });
    await queryInterface.addColumn('delivery_handovers', 'old_partner_confirmed_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('delivery_handovers', 'status', {
      type: Sequelize.ENUM('PENDING', 'OLD_PARTNER_CONFIRMED', 'COMPLETED', 'CANCELLED'),
      allowNull: true,
      defaultValue: 'PENDING'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('delivery_handovers', 'status');
    await queryInterface.removeColumn('delivery_handovers', 'old_partner_confirmed_at');
    await queryInterface.removeColumn('delivery_handovers', 'handover_longitude');
    await queryInterface.removeColumn('delivery_handovers', 'handover_latitude');
    await queryInterface.removeColumn('delivery_handovers', 'assignment_id');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_delivery_handovers_status";');

    await queryInterface.removeColumn('delivery_assignment_history', 'action');
    await queryInterface.removeColumn('delivery_assignment_history', 'assignment_id');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_delivery_assignment_history_action";');

    await queryInterface.sequelize.query(
      'ALTER TABLE "delivery_partners" ALTER COLUMN "status" DROP DEFAULT;'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "delivery_partners" ALTER COLUMN "status" TYPE VARCHAR USING "status"::text;'
    );
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_delivery_partners_status";');

    await queryInterface.removeColumn('delivery_partners', 'current_active_orders');
    await queryInterface.removeColumn('delivery_partners', 'zone_id');
  }
};
