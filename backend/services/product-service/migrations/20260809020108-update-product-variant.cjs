'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      'product_variants', // table name
      'productId',        // old column
      'product_id'        // new column
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      'product_variants',
      'product_id',
      'productId'
    );
  }
};