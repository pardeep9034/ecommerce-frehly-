import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const OTP = sequelize.define('auth_otp', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    code_hash: {
      type: DataTypes.STRING,
      allowNull: false
    },

    type: {
      type: DataTypes.ENUM('SIGNUP', 'RESET'),
      allowNull: false
    },

    channel: {
      type: DataTypes.ENUM('SMS', 'EMAIL'),
      allowNull: false
    },

    sent_to: {
      type: DataTypes.STRING,
      allowNull: false
    },

    attempt_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },

    used_at: {
      type: DataTypes.DATE,
      allowNull: true
    }

  }, {
    tableName: 'auth_otps',
    timestamps: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['expires_at'] }
    ]
  });

  return OTP;
};