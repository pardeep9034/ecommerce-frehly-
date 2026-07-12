'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("delivery_partners", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true
      },
      vehicle_type: {
        type: Sequelize.STRING
      },
      vehicle_number: {
        type: Sequelize.STRING
      },
      max_active_orders: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING
      },
      current_latitude: {
        type: Sequelize.DECIMAL
      },
      current_longitude: {
        type: Sequelize.DECIMAL
      },
      last_location_update_at: {
        type: Sequelize.DATE
      },
      joined_at: {
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

    await queryInterface.createTable("delivery_slots", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING
      },
      start_time: {
        type: Sequelize.TIME
      },
      end_time: {
        type: Sequelize.TIME
      },
      is_active: {
        type: Sequelize.BOOLEAN
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

    await queryInterface.createTable("delivery_assignments", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      order_id: {
        type: Sequelize.UUID
      },
      delivery_partner_id: {
        type: Sequelize.UUID,
        references: {
          model: "delivery_partners",
          key: "id"
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
      },
      delivery_slot_id: {
        type: Sequelize.UUID,
        references: {
          model: "delivery_slots",
          key: "id"
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
      },
      assignment_source: {
        type: Sequelize.STRING
      },
      assigned_by: {
        type: Sequelize.UUID
      },
      assigned_at: {
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.STRING
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

    await queryInterface.createTable("delivery_assignment_history", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      order_id: {
        type: Sequelize.UUID
      },
      old_delivery_partner_id: {
        type: Sequelize.UUID,
        references: {
          model: "delivery_partners",
          key: "id"
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
      },
      new_delivery_partner_id: {
        type: Sequelize.UUID,
        references: {
          model: "delivery_partners",
          key: "id"
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
      },
      reason: {
        type: Sequelize.TEXT
      },
      changed_by: {
        type: Sequelize.UUID
      },
      changed_at: {
        type: Sequelize.DATE
      }
    });

    await queryInterface.createTable("delivery_status_history", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      order_id: {
        type: Sequelize.UUID
      },
      delivery_partner_id: {
        type: Sequelize.UUID,
        references: {
          model: "delivery_partners",
          key: "id"
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
      },
      status: {
        type: Sequelize.STRING
      },
      remarks: {
        type: Sequelize.TEXT
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable("delivery_attempts", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      order_id: {
        type: Sequelize.UUID
      },
      delivery_partner_id: {
        type: Sequelize.UUID,
        references: {
          model: "delivery_partners",
          key: "id"
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
      },
      attempt_number: {
        type: Sequelize.INTEGER
      },
      failure_reason: {
        type: Sequelize.STRING
      },
      remarks: {
        type: Sequelize.TEXT
      },
      attempted_at: {
        type: Sequelize.DATE
      }
    });

    await queryInterface.createTable("delivery_handovers", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      order_id: {
        type: Sequelize.UUID
      },
      old_delivery_partner_id: {
        type: Sequelize.UUID,
        references: {
          model: "delivery_partners",
          key: "id"
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
      },
      new_delivery_partner_id: {
        type: Sequelize.UUID,
        references: {
          model: "delivery_partners",
          key: "id"
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
      },
      reason: {
        type: Sequelize.TEXT
      },
      handover_confirmed_at: {
        type: Sequelize.DATE
      },
      receipt_confirmed_at: {
        type: Sequelize.DATE
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("delivery_handovers");
    await queryInterface.dropTable("delivery_attempts");
    await queryInterface.dropTable("delivery_status_history");
    await queryInterface.dropTable("delivery_assignment_history");
    await queryInterface.dropTable("delivery_assignments");
    await queryInterface.dropTable("delivery_slots");
    await queryInterface.dropTable("delivery_partners");
  }
};
