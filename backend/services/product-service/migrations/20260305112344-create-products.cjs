'use strict';

module.exports = {

  async up(queryInterface, Sequelize) {

    await queryInterface.createTable("products", {

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

      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "categories",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },

      productType: {
        type: Sequelize.STRING
      },

      brand: {
        type: Sequelize.STRING,
        defaultValue: "Freshly"
      },

      description: {
        type: Sequelize.TEXT
      },

      isOrganic: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    await queryInterface.dropTable("products");

  }

};