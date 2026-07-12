'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("orders", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      order_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM(
          "PENDING_PAYMENT",
          "PLACED",
          "CONFIRMED",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
          "CANCELLED",
          "PAYMENT_FAILED",
          "PAYMENT_EXPIRED"
        ),
        allowNull: false
      },
      subtotal: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      delivery_fee: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      discount_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      total_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      payment_status: {
        type: Sequelize.ENUM("PENDING", "SUCCESS", "FAILED", "REFUNDED"),
        allowNull: false
      },
      placed_at: {
        type: Sequelize.DATE
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable("order_items", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      order_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "orders",
          key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },
      product_id: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      variant_id: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      sku: {
        type: Sequelize.STRING(100)
      },
      product_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      variant_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      unit: {
        type: Sequelize.STRING(50)
      },
      quantity: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false
      },
      mrp: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      selling_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      line_total: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable("order_addresses", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      order_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        unique: true,
        references: {
          model: "orders",
          key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },
      full_name: {
        type: Sequelize.STRING(255)
      },
      phone: {
        type: Sequelize.STRING(20)
      },
      address_line_1: {
        type: Sequelize.STRING(255)
      },
      address_line_2: {
        type: Sequelize.STRING(255)
      },
      landmark: {
        type: Sequelize.STRING(255)
      },
      city: {
        type: Sequelize.STRING(100)
      },
      state: {
        type: Sequelize.STRING(100)
      },
      postal_code: {
        type: Sequelize.STRING(20)
      },
      country: {
        type: Sequelize.STRING(100)
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable("order_status_history", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      order_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "orders",
          key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },
      old_status: {
        type: Sequelize.STRING(50)
      },
      new_status: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      changed_by: {
        type: Sequelize.BIGINT
      },
      remarks: {
        type: Sequelize.TEXT
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable("payments", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      order_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "orders",
          key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },
      payment_method: {
        type: Sequelize.ENUM("COD", "UPI", "CARD", "NET_BANKING", "WALLET")
      },
      transaction_id: {
        type: Sequelize.STRING(255)
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2)
      },
      status: {
        type: Sequelize.ENUM("PENDING", "SUCCESS", "FAILED", "REFUNDED", "EXPIRED")
      },
      gateway_response: {
        type: Sequelize.TEXT
      },
      paid_at: {
        type: Sequelize.DATE
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("payments");
    await queryInterface.dropTable("order_status_history");
    await queryInterface.dropTable("order_addresses");
    await queryInterface.dropTable("order_items");
    await queryInterface.dropTable("orders");

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payments_payment_method";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payments_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_payment_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_status";');
  }
};
