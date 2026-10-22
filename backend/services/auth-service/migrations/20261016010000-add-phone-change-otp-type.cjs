'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface) {
    await queryInterface.sequelize.query(`ALTER TYPE "enum_auth_otps_type" ADD VALUE IF NOT EXISTS 'PHONE_CHANGE';`);
  },

  // Postgres cannot drop one value from an enum; leaving it is harmless.
  async down () {}
};
