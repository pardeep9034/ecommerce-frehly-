'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("product_attributes", {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true

            },
            product_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "products",
                    key: "id"
                },
                onDelete: "CASCADE",
                onUpdate: "CASCADE"
            },
            attribute_name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            attribute_value: {
                type: Sequelize.STRING,
                allowNull: false
            },
            data_type: {
                type: Sequelize.ENUM("TEXT", "NUMBER", "BOOLEAN"),
                defaultValue: "TEXT"
            },
            is_filterable: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
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
        await queryInterface.dropTable("product_attributes");
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_product_attributes_data_type";');
    }
};
