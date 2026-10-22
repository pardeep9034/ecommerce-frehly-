'use strict';

/**
 * delivery_status_history is looked up by order_id (the partner's order detail and list). The other delivery tables got
 * this index in the create migration; this one was missed.
 */
const TABLE = 'delivery_status_history';
const NAME = 'delivery_status_history_order_id';

module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex(TABLE, ['order_id'], { name: NAME });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(TABLE, NAME);
  }
};
