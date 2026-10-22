'use strict';

// picked_by is a plain column (no FK): users are owned by auth-service. Set when staff finalize an order's items.
// Orders finalized before this column existed stay empty (the old auto step recorded no one anyway).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "picked_by", {
      type: Sequelize.BIGINT,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("orders", "picked_by");
  }
};
