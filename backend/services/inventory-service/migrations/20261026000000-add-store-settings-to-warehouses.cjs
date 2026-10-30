'use strict';

// The admin warehouse page's Location and Settings tabs: pincode, store hours, pack-by target, and what customers
// see while the store is paused or under maintenance. All optional; unset hours mean open all day.
const COLUMNS = (Sequelize) => ({
  pincode: { type: Sequelize.STRING(6), allowNull: true },
  store_open_time: { type: Sequelize.TIME, allowNull: true },
  store_close_time: { type: Sequelize.TIME, allowNull: true },
  pack_by_minutes: { type: Sequelize.INTEGER, allowNull: true },
  pause_reason: { type: Sequelize.STRING(255), allowNull: true },
  paused_until: { type: Sequelize.DATE, allowNull: true },
  maintenance_message: { type: Sequelize.STRING(255), allowNull: true },
});

module.exports = {
  async up(queryInterface, Sequelize) {
    for (const [name, spec] of Object.entries(COLUMNS(Sequelize))) {
      await queryInterface.addColumn('warehouses', name, spec);
    }
  },

  async down(queryInterface, Sequelize) {
    for (const name of Object.keys(COLUMNS(Sequelize))) {
      await queryInterface.removeColumn('warehouses', name);
    }
  },
};
