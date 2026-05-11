'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create new ENUM with updated values
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_auth_otps_type_new" AS ENUM (
        'SIGNUP',
        'EMAIL_VERIFY',
        'FORGOT_PASSWORD'
      );
    `);

    // 2. Change column to new ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE "auth_otps"
      ALTER COLUMN "type"
      TYPE "enum_auth_otps_type_new"
      USING "type"::text::"enum_auth_otps_type_new";
    `);

    // 3. Drop old ENUM
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_auth_otps_type";
    `);

    // 4. Rename new ENUM to original name
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_auth_otps_type_new"
      RENAME TO "enum_auth_otps_type";
    `);
  },

  async down(queryInterface, Sequelize) {
    // ⚠️ Adjust this to your OLD enum values
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_auth_otps_type_old" AS ENUM (
        'SIGNUP',
        'FORGOT_PASSWORD'
      );
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "auth_otps"
      ALTER COLUMN "type"
      TYPE "enum_auth_otps_type_old"
      USING "type"::text::"enum_auth_otps_type_old";
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE "enum_auth_otps_type";
    `);

    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_auth_otps_type_old"
      RENAME TO "enum_auth_otps_type";
    `);
  }
};