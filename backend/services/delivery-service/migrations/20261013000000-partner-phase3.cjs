'use strict';

/**
 * Partner onboarding Phase 3 (duplicate-document warnings, P3-8).
 *  - (type, number_hmac) on documents, only where a number was typed: "who else used this Aadhaar?" is an index lookup
 *    instead of a scan. Phase 1 left number_hmac unindexed on purpose ("add it with the duplicate-document warning").
 *    Not unique: the same number on two applications is a warning for the reviewer, never an error.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('delivery_partner_documents', ['type', 'number_hmac'], {
      name: 'delivery_partner_documents_type_number_hmac_idx',
      where: { number_hmac: { [Sequelize.Op.ne]: null } }
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('delivery_partner_documents', 'delivery_partner_documents_type_number_hmac_idx');
  }
};
