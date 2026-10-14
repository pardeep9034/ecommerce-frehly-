'use strict';

/**
 * Partner onboarding Phase 2 (DELIVERY_PARTNER_ONBOARDING_DESIGN.md §5.2).
 *  - delivery_partners.application_id: written at approval. The unique index (only where it is set) is the database's
 *    last defence against one application creating two partners. No foreign key, like partner_id on the application:
 *    the two tables would point at each other.
 *  - (status, submitted_at) on applications: the review queue filters by status and sorts oldest first.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('delivery_partners', 'application_id', { type: Sequelize.UUID, allowNull: true }, { transaction });
      await queryInterface.addIndex('delivery_partners', ['application_id'], {
        name: 'delivery_partners_application_id_key',
        unique: true,
        where: { application_id: { [Sequelize.Op.ne]: null } },
        transaction
      });
      await queryInterface.addIndex('delivery_partner_applications', ['status', 'submitted_at'], {
        name: 'delivery_partner_applications_status_submitted_idx',
        transaction
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('delivery_partner_applications', 'delivery_partner_applications_status_submitted_idx', { transaction });
      await queryInterface.removeIndex('delivery_partners', 'delivery_partners_application_id_key', { transaction });
      await queryInterface.removeColumn('delivery_partners', 'application_id', { transaction });
    });
  }
};
