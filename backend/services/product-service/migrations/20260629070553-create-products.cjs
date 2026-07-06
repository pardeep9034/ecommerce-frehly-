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
        allowNull: false,
        unique: true
      },

      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "categories",
          key: "id"
        },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE"
      },

      product_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "product_types",
          key: "id"
        },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE"
      },

      brand_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "brands",
          key: "id"
        },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE"
      },

      description: {
        type: Sequelize.TEXT
      },

      short_description: {
        type: Sequelize.STRING(500),
        allowNull: false
      },

      is_organic: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },

      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },

      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },

      status: {
        type: Sequelize.ENUM("DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"),
        defaultValue: "DRAFT"
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("products");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_products_status";');
  }
};