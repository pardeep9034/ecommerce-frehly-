'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("delivery_zones", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      postal_codes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      radius_km: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      delivery_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      minimum_order_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      estimated_delivery_time: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.createTable("delivery_partner_zones", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      delivery_partner_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "delivery_partners",
          key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },
      zone_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "delivery_zones",
          key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.addIndex("delivery_zones", ["code"], { unique: true });
    await queryInterface.addIndex("delivery_partner_zones", ["delivery_partner_id"]);
    await queryInterface.addIndex("delivery_partner_zones", ["zone_id"]);
    await queryInterface.addIndex(
      "delivery_partner_zones",
      ["delivery_partner_id", "zone_id"],
      { unique: true }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("delivery_partner_zones");
    await queryInterface.dropTable("delivery_zones");
  }
};
