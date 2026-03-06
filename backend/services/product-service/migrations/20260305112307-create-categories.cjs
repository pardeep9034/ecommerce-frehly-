'use strict';

module.exports = {

  async up(queryInterface, Sequelize) {

    await queryInterface.createTable("categories", {

      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false
      },

      slug: {
        type: Sequelize.STRING,
        unique: true
      },

      image: {
        type: Sequelize.TEXT
      },

      status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }

    });

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.dropTable("categories");

  }

};