"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable("refresh_tokens", {

      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      token_hash: {
        type: Sequelize.STRING,
        allowNull: false
      },

      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },

      is_revoked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }

    });

    await queryInterface.addIndex("refresh_tokens", ["user_id"]);
    await queryInterface.addIndex("refresh_tokens", ["token_hash"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("refresh_tokens");
  }
};
