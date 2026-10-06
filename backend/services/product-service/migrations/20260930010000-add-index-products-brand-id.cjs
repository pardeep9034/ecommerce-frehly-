'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('products', ['brand_id'], {
      name: 'products_brand_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('products', 'products_brand_id_idx');
  },
};
