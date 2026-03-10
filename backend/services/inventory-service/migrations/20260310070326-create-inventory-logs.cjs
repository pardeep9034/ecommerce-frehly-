'use strict';


module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("inventory_logs",{
      id:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true
      },
      inventoryId:{
        type:Sequelize.INTEGER,
        allowNull:false
      },
      type:{
        type:Sequelize.ENUM(
          "purchase",
          "sale",
          "adjustment",
          "return"
        ),
        allowNull:false
      },
      quantity:{
        type:Sequelize.INTEGER,
        allowNull:false
      },
      previousStock:{
        type:Sequelize.INTEGER,
        allowNull:false
      },
      newStock:{
        type:Sequelize.INTEGER,
        allowNull:false
      },
      note:{
        type:Sequelize.TEXT
      },
      createdAt:{
        allowNull:false,
        type:Sequelize.DATE
      },
      updatedAt:{
        allowNull:false,
        type:Sequelize.DATE
      }
    })
    
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("inventory_logs")
   
  }
};
