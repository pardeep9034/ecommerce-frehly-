'use strict';

const STATUSES = ['OPEN', 'PAUSED', 'MAINTENANCE', 'SETTING_UP'];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('warehouses', 'operational_status', {
      type: Sequelize.ENUM(...STATUSES),
      allowNull: false,
      defaultValue: 'OPEN',
    });
    // A warehouse already switched off (is_active = false) should not show as Open.
    await queryInterface.sequelize.query(
      "UPDATE warehouses SET operational_status = 'PAUSED' WHERE is_active = false"
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('warehouses', 'operational_status');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_warehouses_operational_status"');
  },
};
