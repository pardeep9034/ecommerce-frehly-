'use strict'

module.exports= {async up(queryInterface, Sequelize) {
  await queryInterface.createTable("cart_items", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    cartId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },

    productId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },

    variantId: {
      type: Sequelize.INTEGER,
      allowNull: true
    },

    quantity: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    },

    priceSnapshot: {
      type: Sequelize.FLOAT,
      allowNull: false
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
},

 async  down(queryInterface, Sequelize) {
  await queryInterface.dropTable("cart_items");
}}
    