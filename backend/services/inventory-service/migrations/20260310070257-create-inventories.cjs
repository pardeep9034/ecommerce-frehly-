'use strict'

module.exports={
  async up(queryInterface,Sequelize){
    await queryInterface.createTable("inventories",{
      id:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true
      },
      variantId:{
        type:Sequelize.INTEGER,
        allowNull:false,
        references:{
          model:"product_variants",
          key:"id"
        }
      },
      stock:{
        type:Sequelize.INTEGER,
        allowNull:false,
        defaultValue:0
      },
      reservedStock:{
        type:Sequelize.INTEGER,
        defaultValue:0
      },
      lowStockAlert:{
        type:Sequelize.INTEGER,
        defaultValue:5
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
  async down(queryInterface,Sequelize){
    await queryInterface.dropTable("inventories")
  }
}