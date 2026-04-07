'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const addColumnIfNotExists = async (table, column, definition) => {
      try {
        await queryInterface.addColumn(table, column, definition);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
        console.log(`Column ${column} already exists in ${table}, skipping...`);
      }
    };

    // 1. Update refresh_tokens table safely
    await addColumnIfNotExists('refresh_tokens', 'device_id', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('refresh_tokens', 'user_agent', {
      type: Sequelize.STRING,
      allowNull: true
    });

    try {
      // Add as nullable first
      await queryInterface.addColumn('refresh_tokens', 'family_id', {
        type: Sequelize.UUID,
        allowNull: true
      });

      // Populate existing rows with random UUIDs using raw SQL
      await queryInterface.sequelize.query('UPDATE "refresh_tokens" SET "family_id" = gen_random_uuid() WHERE "family_id" IS NULL');

      // Now set to NOT NULL with default
      await queryInterface.changeColumn('refresh_tokens', 'family_id', {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      });
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('Column family_id already exists in refresh_tokens, skipping...');
    }

    // 2. Create auth_audit_logs table if not exists
    try {
      await queryInterface.createTable('auth_audit_logs', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },

        user_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'auth_users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },

        event_type: {
          type: Sequelize.ENUM(
            'LOGIN_SUCCESS',
            'LOGIN_FAILURE',
            'LOGOUT',
            'PASSWORD_CHANGE',
            'PASSWORD_RESET_REQUEST',
            'PASSWORD_RESET_SUCCESS',
            'ACCOUNT_LOCKED',
            'ACCOUNT_UNLOCKED',
            'ROLE_CHANGE',
            'OTP_SENT',
            'OTP_VERIFIED'
          ),
          allowNull: false
        },

        email: {
          type: Sequelize.STRING,
          allowNull: true
        },

        phone: {
          type: Sequelize.STRING,
          allowNull: true
        },

        ip_address: {
          type: Sequelize.STRING,
          allowNull: true
        },

        user_agent: {
          type: Sequelize.STRING,
          allowNull: true
        },

        device_id: {
          type: Sequelize.STRING,
          allowNull: true
        },

        details: {
          type: Sequelize.JSONB,
          allowNull: true
        },

        status: {
          type: Sequelize.ENUM('SUCCESS', 'FAILURE'),
          defaultValue: 'SUCCESS'
        },

        error_message: {
          type: Sequelize.TEXT,
          allowNull: true
        },

        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      });

      // Add indexes for audit logs
      await queryInterface.addIndex('auth_audit_logs', ['user_id']);
      await queryInterface.addIndex('auth_audit_logs', ['event_type']);
      await queryInterface.addIndex('auth_audit_logs', ['created_at']);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('Table auth_audit_logs already exists, skipping...');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('auth_audit_logs');
    await queryInterface.removeColumn('refresh_tokens', 'device_id');
    await queryInterface.removeColumn('refresh_tokens', 'user_agent');
    await queryInterface.removeColumn('refresh_tokens', 'family_id');
    
    // Drop Enum types manually if using Postgres
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_auth_audit_logs_event_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_auth_audit_logs_status";');
  }
};
