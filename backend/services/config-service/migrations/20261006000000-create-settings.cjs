'use strict';

// One row per settings group (general, orderRules, ...); `value` holds only
// the fields an admin has saved, defaults are filled in on read.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("settings", {
      key: {
        type: Sequelize.STRING(50),
        primaryKey: true
      },
      value: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      updated_by: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("settings");
  }
};
