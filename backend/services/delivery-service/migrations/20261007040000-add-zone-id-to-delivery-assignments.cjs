'use strict';

/**
 * The DeliveryAssignment model has belongsTo(DeliveryZone, { foreignKey: "zone_id" }), so Sequelize
 * expects this column on every insert and select, but no migration ever created it.
 * Nullable, and SET NULL on zone delete: the zone is a record on the assignment, so deleting a
 * zone must not delete delivery history.
 * ponytail: no index; add one with the first per-zone assignment query.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('delivery_assignments', 'zone_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: { model: 'delivery_zones', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('delivery_assignments', 'zone_id');
  }
};
