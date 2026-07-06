'use strict'

module.exports={
  async up(queryInterface,Sequelize){
    await queryInterface.createTable("inventory",{
     id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true,
          },
    
          variant_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
            unique: true,
         
          },
    
          current_stock: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
    
          reserved_stock: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
    
          low_stock_threshold: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 10,
          },
    
          last_stock_update_at: {
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
  async down(queryInterface,Sequelize){
    await queryInterface.dropTable("inventory")
  }
}