import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const AuditLog = sequelize.define('auth_audit_log', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    event_type: {
      type: DataTypes.ENUM(
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
      type: DataTypes.STRING,
      allowNull: true
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },

    ip_address: {
      type: DataTypes.STRING,
      allowNull: true
    },

    user_agent: {
      type: DataTypes.STRING,
      allowNull: true
    },

    device_id: {
      type: DataTypes.STRING,
      allowNull: true
    },

    details: {
      type: DataTypes.JSONB,
      allowNull: true
    },

    status: {
      type: DataTypes.ENUM('SUCCESS', 'FAILURE'),
      defaultValue: 'SUCCESS'
    },

    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    }

  }, {
    tableName: 'auth_audit_logs',
    timestamps: true,
    updatedAt: false, // Audit logs are immutable
    indexes: [
      { fields: ['user_id'] },
      { fields: ['event_type'] },
      { fields: ['created_at'] }
    ]
  });

  return AuditLog;
};
