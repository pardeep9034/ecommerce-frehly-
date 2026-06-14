'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("addresses", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    userId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },

    fullName: {
      type: Sequelize.STRING
    },

    phone: {
      type: Sequelize.STRING
    },

    pincode: {
      type: Sequelize.STRING
    },

    state: {
      type: Sequelize.STRING
    },

    city: {
      type: Sequelize.STRING
    },

    addressLine1: {
      type: Sequelize.STRING
    },

    addressLine2: {
      type: Sequelize.STRING
    },

    landmark: {
      type: Sequelize.STRING
    },

    addressType: {
      type: Sequelize.ENUM("HOME", "WORK", "OTHER")
    },

    isDefault: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
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

  await queryInterface.addIndex("addresses", ["userId"]);
  await queryInterface.addIndex("addresses", ["userId", "isDefault"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("addresses");
    await queryInterface.removeIndex("addresses", ["userId"]);
    await queryInterface.removeIndex("addresses", ["userId", "isDefault"]);
  }
};