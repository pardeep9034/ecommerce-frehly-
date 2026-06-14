'use strict';

module.exports= {
  async up (queryInterface, Sequelize) {
  await queryInterface.createTable("carts", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      unique: true   // 🔥 one cart per user
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
  await queryInterface.dropTable("carts");
}}