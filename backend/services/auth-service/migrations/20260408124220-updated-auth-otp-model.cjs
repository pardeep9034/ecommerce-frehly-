'use strict';


module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('auth_otps', 'created_at');
    await queryInterface.removeColumn('auth_otps', 'updated_at');
    await queryInterface.addIndex('auth_otps', ['user_id', 'type'],
      {name: 'idx_auth_otps_user_id_type'}
    );
    await queryInterface.addIndex('auth_otps', ['expires_at'],
      {name: 'idx_auth_otps_expires_at'}
    );
    await queryInterface.addIndex('auth_otps',['user_id'],{name:'idx_auth_otps_user_id'})
   
    


   
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('auth_otps', 'idx_auth_otps_user_id_type');
    await queryInterface.removeIndex('auth_otps', 'idx_auth_otps_expires_at');
    await queryInterface.removeIndex('auth_otps', 'idx_auth_otps_user_id');
  }
};
