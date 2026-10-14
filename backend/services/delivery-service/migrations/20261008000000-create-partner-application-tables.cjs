'use strict';

/**
 * Partner onboarding (DELIVERY_PARTNER_ONBOARDING_DESIGN.md §5.1): the application, its documents, its
 * screening checks and its event log. Everything in one transaction. The shown reference number
 * ("FR-P-1001") comes from a sequence. A user may hold only one open application, enforced by a partial
 * unique index. Nothing here touches delivery_partners; the link to the partner row arrives with approval.
 */
const STATUSES = ['DRAFT', 'NEW', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED'];
const VEHICLE_TYPES = ['BIKE', 'SCOOTER', 'EV_SCOOTER', 'CYCLE'];
const DOC_TYPES = ['PHOTO', 'AADHAAR', 'DL', 'RC', 'PAN'];
const CHECK_KEYS = ['PHONE_OTP', 'ID_MATCH', 'DL_VALID', 'RC_MATCH', 'BG_CHECK', 'SAFETY_BRIEFING'];
const EVENT_TYPES = [
  'CREATED', 'SUBMITTED', 'DOC_UPLOADED', 'DOC_VIEWED', 'DOC_VERIFIED', 'DOC_REJECTED', 'CHECK_DONE',
  'CHECK_UNDONE', 'REVIEW_STARTED', 'NOTE', 'CHANGES_REQUESTED', 'RESUBMITTED', 'APPROVED', 'REJECTED'
];

const ENUM_TYPES = [
  'enum_delivery_partner_applications_vehicle_type',
  'enum_delivery_partner_applications_source',
  'enum_delivery_partner_applications_status',
  'enum_delivery_partner_documents_type',
  'enum_delivery_partner_documents_status',
  'enum_delivery_partner_application_checks_check_key',
  'enum_delivery_partner_application_events_type'
];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query('CREATE SEQUENCE partner_application_ref_seq START 1001', { transaction });

      await queryInterface.createTable('delivery_partner_applications', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        ref_no: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: Sequelize.literal("nextval('partner_application_ref_seq')")
        },
        user_id: { type: Sequelize.BIGINT, allowNull: false },
        name: { type: Sequelize.STRING(150), allowNull: false },
        phone: { type: Sequelize.STRING(20), allowNull: false },
        email: { type: Sequelize.STRING(150), allowNull: true },
        preferred_zone_id: { type: Sequelize.BIGINT, allowNull: true },
        vehicle_type: { type: Sequelize.ENUM(...VEHICLE_TYPES), allowNull: false },
        vehicle_number: { type: Sequelize.STRING(20), allowNull: true },
        source: { type: Sequelize.ENUM('SELF', 'ADMIN'), allowNull: false, defaultValue: 'SELF' },
        created_by: { type: Sequelize.BIGINT, allowNull: true },
        status: { type: Sequelize.ENUM(...STATUSES), allowNull: false, defaultValue: 'DRAFT' },
        consent_at: { type: Sequelize.DATE, allowNull: true },
        submitted_at: { type: Sequelize.DATE, allowNull: true },
        reviewer_id: { type: Sequelize.BIGINT, allowNull: true },
        review_started_at: { type: Sequelize.DATE, allowNull: true },
        decided_at: { type: Sequelize.DATE, allowNull: true },
        decided_by: { type: Sequelize.BIGINT, allowNull: true },
        decision_reason: { type: Sequelize.STRING(100), allowNull: true },
        decision_note: { type: Sequelize.TEXT, allowNull: true },
        partner_id: { type: Sequelize.UUID, allowNull: true },
        version: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction });

      // One open application per user; APPROVED and REJECTED are final, so a rejected person may reapply.
      await queryInterface.sequelize.query(
        `CREATE UNIQUE INDEX delivery_partner_applications_one_open_per_user
         ON delivery_partner_applications (user_id)
         WHERE status NOT IN ('APPROVED', 'REJECTED')`,
        { transaction }
      );
      // ponytail: no (status, submitted_at) index for the review queue yet; add it with the queue in Phase 2.

      await queryInterface.createTable('delivery_partner_documents', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        application_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'delivery_partner_applications', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        type: { type: Sequelize.ENUM(...DOC_TYPES), allowNull: false },
        status: { type: Sequelize.ENUM('UPLOADED', 'VERIFIED', 'REJECTED'), allowNull: false, defaultValue: 'UPLOADED' },
        file_key: { type: Sequelize.STRING, allowNull: false },
        mime: { type: Sequelize.STRING(50), allowNull: false },
        size_bytes: { type: Sequelize.INTEGER, allowNull: false },
        sha256: { type: Sequelize.STRING(64), allowNull: false },
        number_masked: { type: Sequelize.STRING(30), allowNull: true },
        number_hmac: { type: Sequelize.STRING(64), allowNull: true },
        expiry_date: { type: Sequelize.DATEONLY, allowNull: true },
        verified_by: { type: Sequelize.BIGINT, allowNull: true },
        verified_at: { type: Sequelize.DATE, allowNull: true },
        reject_reason: { type: Sequelize.TEXT, allowNull: true },
        uploaded_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
      }, { transaction });
      await queryInterface.addConstraint('delivery_partner_documents', {
        fields: ['application_id', 'type'],
        type: 'unique',
        name: 'delivery_partner_documents_application_type_unique',
        transaction
      });
      // ponytail: no number_hmac index yet; add it with the Phase 3 duplicate-document warning.

      await queryInterface.createTable('delivery_partner_application_checks', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        application_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'delivery_partner_applications', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        check_key: { type: Sequelize.ENUM(...CHECK_KEYS), allowNull: false },
        done: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        done_by: { type: Sequelize.BIGINT, allowNull: true },
        done_at: { type: Sequelize.DATE, allowNull: true },
        note: { type: Sequelize.TEXT, allowNull: true }
      }, { transaction });
      await queryInterface.addConstraint('delivery_partner_application_checks', {
        fields: ['application_id', 'check_key'],
        type: 'unique',
        name: 'delivery_partner_application_checks_application_key_unique',
        transaction
      });

      await queryInterface.createTable('delivery_partner_application_events', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        // RESTRICT, not CASCADE: this is the audit log, so deleting an application must not silently erase it.
        application_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'delivery_partner_applications', key: 'id' },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE'
        },
        type: { type: Sequelize.ENUM(...EVENT_TYPES), allowNull: false },
        actor_id: { type: Sequelize.BIGINT, allowNull: true },
        actor_role: { type: Sequelize.STRING(30), allowNull: true },
        visible_to_applicant: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        payload: { type: Sequelize.JSONB, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false }
      }, { transaction });
      await queryInterface.addIndex('delivery_partner_application_events', ['application_id', 'created_at'], {
        name: 'delivery_partner_application_events_application_created_idx',
        transaction
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('delivery_partner_application_events', { transaction });
      await queryInterface.dropTable('delivery_partner_application_checks', { transaction });
      await queryInterface.dropTable('delivery_partner_documents', { transaction });
      await queryInterface.dropTable('delivery_partner_applications', { transaction });
      for (const type of ENUM_TYPES) {
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${type}"`, { transaction });
      }
      await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS partner_application_ref_seq', { transaction });
    });
  }
};
