'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("inventory", "warehouse_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: "warehouses",
        key: "id",
      },
    });

    await queryInterface.addColumn("inventory_reservations", "warehouse_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: "warehouses",
        key: "id",
      },
    });

    await queryInterface.addColumn("stock_movements", "warehouse_id", {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: "warehouses",
        key: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("stock_movements", "warehouse_id");
    await queryInterface.removeColumn("inventory_reservations", "warehouse_id");
    await queryInterface.removeColumn("inventory", "warehouse_id");
  },
};
