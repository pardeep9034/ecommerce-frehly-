'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("product_images", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references:{
          model:"products",
          key:"id"
        },
        onDelete:"CASCADE",
        onUpdate:"CASCADE"
      },
      variant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references:{
          model:"product_variants",
          key:"id"
        },
        onDelete:"CASCADE",
        onUpdate:"CASCADE"
      },

      image_url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      public_id: {
        type: Sequelize.STRING
      },

      alt_text: {
        type: Sequelize.STRING
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0

      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }

    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("product_images")
  }
};
