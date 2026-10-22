'use strict';

// notification-service: `notifications` is both the outbox and the log (one row per message),
// `notification_preferences` holds each admin's saved "Email me when" switches (defaults filled on read),
// `notification_alert_hits` counts each failed payment once for the 5-in-60-min alert.
// No foreign keys to auth_users: another service owns that table. Times default to the database clock.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE notifications (
        id                  BIGSERIAL PRIMARY KEY,
        idempotency_key     VARCHAR(200) NOT NULL UNIQUE,
        source_event_id     UUID,
        subject_id          VARCHAR(64),
        template_key        VARCHAR(64) NOT NULL,
        template_version    SMALLINT,
        channel             VARCHAR(8)  NOT NULL CHECK (channel IN ('SMS', 'EMAIL')),
        category            VARCHAR(16) NOT NULL CHECK (category IN ('TRANSACTIONAL', 'ALERT', 'DIGEST')),
        priority            SMALLINT    NOT NULL DEFAULT 5,
        recipient_user_id   BIGINT,
        destination         VARCHAR(254),
        destination_masked  VARCHAR(254),
        destination_hash    CHAR(64),
        vars                JSONB       NOT NULL DEFAULT '{}',
        sensitive           BOOLEAN     NOT NULL DEFAULT false,
        status              VARCHAR(10) NOT NULL CHECK (status IN ('QUEUED', 'SENDING', 'SENT', 'FAILED', 'SKIPPED')),
        reason              VARCHAR(32),
        last_error          VARCHAR(300),
        attempts            SMALLINT    NOT NULL DEFAULT 0,
        next_attempt_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        locked_at           TIMESTAMPTZ,
        provider            VARCHAR(32),
        provider_message_id VARCHAR(100),
        sent_at             TIMESTAMPTZ,
        created_by          BIGINT,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX notifications_due_idx ON notifications (priority, next_attempt_at) WHERE status IN ('QUEUED', 'SENDING');
      CREATE INDEX notifications_destination_idx ON notifications (destination_hash, channel, created_at);
      CREATE INDEX notifications_subject_idx ON notifications (template_key, subject_id, created_at);
      CREATE INDEX notifications_recipient_idx ON notifications (recipient_user_id, created_at DESC);
      CREATE INDEX notifications_created_idx ON notifications (created_at DESC);

      CREATE TABLE notification_preferences (
        user_id    BIGINT PRIMARY KEY,
        value      JSONB       NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE notification_alert_hits (
        id          BIGSERIAL PRIMARY KEY,
        alert_key   VARCHAR(64)  NOT NULL,
        source_key  VARCHAR(100) NOT NULL,
        occurred_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
        UNIQUE (alert_key, source_key)
      );
      CREATE INDEX notification_alert_hits_window_idx ON notification_alert_hits (alert_key, occurred_at);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS notification_alert_hits;
      DROP TABLE IF EXISTS notification_preferences;
      DROP TABLE IF EXISTS notifications;
    `);
  }
};
