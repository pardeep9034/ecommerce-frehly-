import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

export default (sequelize) => {
  const User = sequelize.define('auth_user', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    first_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: [2, 50],
        notEmpty: false
      }
    },

    last_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: [2, 50],
        notEmpty: false
      }
    },

    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },

    phone: {
      type: DataTypes.STRING(15),
      unique: true,
      allowNull: false,
      validate: {
        isNumeric: true,
        len: [10, 15]
      }
    },

    password: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [6, 100],
        notEmpty: false
      }
    },

    otp_hash: {
      type: DataTypes.STRING,
      allowNull: true
    },

    otp_type: {
      type: DataTypes.ENUM('signup', 'email_verify', 'forgot_password'),
      allowNull: true
    },

    otp_expiry: {
      type: DataTypes.DATE,
      allowNull: true
    },

    otp_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    otp_send_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    last_otp_sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    },

    role: {
      type: DataTypes.ENUM('CUSTOMER', 'ADMIN', 'OPS_STAFF', 'VENDOR'),
      defaultValue: 'CUSTOMER'
    },

    refresh_token: {
      type: DataTypes.STRING,
      allowNull: true
    },

    refresh_token_expiry: {
      type: DataTypes.DATE,
      allowNull: true
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    phone_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true
    },

    login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    lock_until: {
      type: DataTypes.DATE,
      allowNull: true
    },
    force_password_change: {
  type: DataTypes.BOOLEAN,
  defaultValue: false
},
    failed_login_attempts: {
  type: DataTypes.INTEGER,
  defaultValue: 0
},
account_locked_until: {
  type: DataTypes.DATE,
  allowNull: true
},
last_login_ip: {
  type: DataTypes.STRING,
  allowNull: true
},
last_login_device: {
  type: DataTypes.STRING,
  allowNull: true
},
      deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }

  }, {
    tableName: 'auth_users',
    timestamps: true,
    paranoid: true,
     deletedAt: 'deleted_at',

    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(
            user.password,
            parseInt(process.env.BCRYPT_ROUNDS, 10) || 12
          );
        }
      },

      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(
            user.password,
            parseInt(process.env.BCRYPT_ROUNDS, 10) || 12
          );
        }
      }
    }
  });

  /* ======================
     Instance Methods
  ====================== */

  User.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.isLocked = function () {
    return this.lock_until && this.lock_until > new Date();
  };

  User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    delete values.refresh_token;
    delete values.login_attempts;
    delete values.lock_until;
    return values;
  };

  return User;
};
