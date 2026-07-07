'use strict';

module.exports= {
  async up (queryInterface, Sequelize) {
  await queryInterface.createTable("carts", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      unique: true   // 🔥 one cart per user
    },
     coupon_code: {
      type:Sequelize.STRING,
      allowNull:true,
    },
    is_active:{
type:Sequelize.BOOLEAN,
defaultValue:true,
allowNull:false
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

 async  down(queryInterface, Sequelize) {
  await queryInterface.dropTable("carts");
}}