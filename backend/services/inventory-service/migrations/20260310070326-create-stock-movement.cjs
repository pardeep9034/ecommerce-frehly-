'use strict';


module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("stock_movements",{
     id: {
             type: Sequelize.BIGINT,
             primaryKey: true,
             autoIncrement: true,
           },
     
           variant_id: {
             type: Sequelize.BIGINT,
             allowNull: false,
            
           },
     
           movement_type: {
             type: Sequelize.ENUM(
               "STOCK_IN",
               "SALE",
               "ADJUSTMENT",
               "DAMAGE",
               "RETURN"
             ),
             allowNull: false,
           },
     
           quantity: {
             type: Sequelize.INTEGER,
             allowNull: false,
           },
     
           before_stock: {
             type: Sequelize.INTEGER,
             allowNull: false,
           },
     
           after_stock: {
             type: Sequelize.INTEGER,
             allowNull: false,
           },
     
           reason: {
             type: Sequelize.TEXT,
             allowNull: true,
           },
     
           created_by: {
             type: Sequelize.BIGINT,
             allowNull: false,
           },
      created_at:{
        allowNull:false,
        type:Sequelize.DATE
      },
    
    })
    
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("stock_movements")
   
  }
};
