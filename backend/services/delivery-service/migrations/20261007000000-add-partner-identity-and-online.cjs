'use strict';

/**
 * Adds the columns the dashboard partner list needs: a copy of the partner's
 * name and phone (identity lives in auth-service) and an online flag.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('delivery_partners', 'name', {
      type: Sequelize.STRING(150),
      allowNull: true
    });
    await queryInterface.addColumn('delivery_partners', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: true
    });
    await queryInterface.addColumn('delivery_partners', 'is_online', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn('delivery_partners', 'online_since', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('delivery_partners', 'online_since');
    await queryInterface.removeColumn('delivery_partners', 'is_online');
    await queryInterface.removeColumn('delivery_partners', 'phone');
    await queryInterface.removeColumn('delivery_partners', 'name');
  }
};
