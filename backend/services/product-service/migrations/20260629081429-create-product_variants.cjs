'use strict';

/** @type {import('sequelize-cli').Migration} */
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
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },

      sku: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      barcode: {
        type: Sequelize.STRING,
        unique: true
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      measurement_unit_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "measurement_units",
          key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },


      price: {
        type: Sequelize.FLOAT,
        allowNull: false
      },

      mrp: {
        type: Sequelize.FLOAT,
        allowNull: false
      },

      status: {
        type: Sequelize.ENUM("ACTIVE", "INACTIVE", "ARCHIVED"),
        allowNull: false

      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
    await queryInterface.dropTable("product_variants")
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_product_variants_status"`)
  }
};
