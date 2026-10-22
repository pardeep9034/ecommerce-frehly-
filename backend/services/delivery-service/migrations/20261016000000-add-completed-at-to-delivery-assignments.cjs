'use strict';

/**
 * When an assignment finished (delivered, failed, handed over, cancelled). A trigger sets it the moment status leaves
 * ACTIVE (or on insert of an already-finished row), so every code path that closes an assignment (status update, handover, re-assign) gets it without remembering.
 * Rows already finished take updated_at, the closest thing they have.
 */
const TABLE = 'delivery_assignments';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(TABLE, 'completed_at', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.sequelize.query(`UPDATE ${TABLE} SET completed_at = updated_at WHERE status <> 'ACTIVE'`);
    await queryInterface.sequelize.query(`
      CREATE FUNCTION delivery_assignments_set_completed_at() RETURNS trigger AS $$
      BEGIN
        IF NEW.status <> 'ACTIVE' AND (TG_OP = 'INSERT' OR OLD.status = 'ACTIVE') THEN
          NEW.completed_at := COALESCE(NEW.completed_at, now());
        END IF;
        RETURN NEW;
      END $$ LANGUAGE plpgsql`);
    await queryInterface.sequelize.query(`
      CREATE TRIGGER delivery_assignments_completed_at BEFORE INSERT OR UPDATE OF status ON ${TABLE}
      FOR EACH ROW EXECUTE FUNCTION delivery_assignments_set_completed_at()`);
    await queryInterface.addIndex(TABLE, ['delivery_partner_id', 'completed_at'], { name: 'delivery_assignments_partner_completed_at' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(TABLE, 'delivery_assignments_partner_completed_at');
    await queryInterface.sequelize.query(`DROP TRIGGER delivery_assignments_completed_at ON ${TABLE}`);
    await queryInterface.sequelize.query('DROP FUNCTION delivery_assignments_set_completed_at()');
    await queryInterface.removeColumn(TABLE, 'completed_at');
  }
};
