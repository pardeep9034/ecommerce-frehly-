'use strict';

/**
 * A handover can now be called off (the receiver declines or the giver withdraws). The row keeps when, and which partner
 * did it (null = staff). receipt_confirmed_at already exists from the first delivery migration and is now written too.
 */
const TABLE = 'delivery_handovers';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(TABLE, 'cancelled_at', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn(TABLE, 'cancelled_by', { type: Sequelize.UUID, allowNull: true });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn(TABLE, 'cancelled_by');
    await queryInterface.removeColumn(TABLE, 'cancelled_at');
  }
};
