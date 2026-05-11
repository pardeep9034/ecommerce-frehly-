'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('cart_items', 'productNameSnapshot', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('cart_items', 'variantNameSnapshot', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('cart_items', 'productNameSnapshot');
    await queryInterface.removeColumn('cart_items', 'variantNameSnapshot');
  }
};
