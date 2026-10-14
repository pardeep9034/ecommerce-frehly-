'use strict';

/**
 * One plate, one partner. The service already checks before it inserts, but two requests can pass that check
 * together; this closes the gap in the database.
 *
 * NULL is allowed many times (a cycle has no plate), so partners without a plate do not collide.
 * If two partners already share a plate, Postgres refuses and names the duplicated value; fix that row first.
 * The constraint name is Postgres's own default, like delivery_partners_user_id_key.
 */
const TABLE = 'delivery_partners';
const NAME = 'delivery_partners_vehicle_number_key';

module.exports = {
  async up(queryInterface) {
    await queryInterface.addConstraint(TABLE, { fields: ['vehicle_number'], type: 'unique', name: NAME });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(TABLE, NAME);
  }
};
