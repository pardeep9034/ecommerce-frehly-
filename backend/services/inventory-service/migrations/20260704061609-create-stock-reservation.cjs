'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("inventory_reservations",{
  id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },

      order_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },

      variant_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
       
      },

      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM(
          "ACTIVE",
          "CONFIRMED",
          "RELEASED",
          "EXPIRED"
        ),
        allowNull: false,
        defaultValue: "ACTIVE",
      },

      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at:{
        allowNull:false,
        type:Sequelize.DATE
      },
      updated_at:{
        allowNull:false,
        type:Sequelize.DATE
      }
    })
             
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("inventory_reservations")
    await queryInterface.sequelize.query(
  'DROP TYPE IF EXISTS "enum_inventory_reservations_status";'
);
  }
};
