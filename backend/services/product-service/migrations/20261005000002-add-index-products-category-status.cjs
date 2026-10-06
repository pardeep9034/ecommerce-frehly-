'use strict';

// Speeds up GET /product filters. brand_id is in 20260930010000-add-index-products-brand-id.cjs.
const INDEXES = [
  ['category_id', 'products_category_id_idx'],
  ['status', 'products_status_idx'],
];

module.exports = {
  async up(queryInterface) {
    for (const [column, name] of INDEXES) {
      await queryInterface.addIndex('products', [column], { name });
    }
  },

  async down(queryInterface) {
    for (const [, name] of INDEXES) {
      await queryInterface.removeIndex('products', name);
    }
  },
};
