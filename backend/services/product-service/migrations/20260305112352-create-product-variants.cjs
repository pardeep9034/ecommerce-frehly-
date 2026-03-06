'use strict';

module.exports = {

  async up(queryInterface, Sequelize) {

    await queryInterface.createTable("product_variants", {

      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "products",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },

      unitType: {
        type: Sequelize.ENUM("weight", "piece", "pack"),
        allowNull: false
      },

      value: {
        type: Sequelize.FLOAT
      },

      unit: {
        type: Sequelize.STRING
      },

      price: {
        type: Sequelize.FLOAT,
        allowNull: false
      },

      mrp: {
        type: Sequelize.FLOAT
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

    await queryInterface.dropTable("product_variants");

  }

};