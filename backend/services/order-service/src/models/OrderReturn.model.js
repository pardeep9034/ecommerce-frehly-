import { DataTypes } from "sequelize";

// One returned item (or part of one). FAILED_DELIVERY: the whole order came back. DOORSTEP: the customer refused this
// item when the rest was delivered. CUSTOMER: asked for after delivery.
// IN_TRANSIT (the rider holds it) -> RECEIVED (store has it) -> CLOSED (inspected: restocked/written off, refunded).
// CUSTOMER starts at REQUESTED -> REJECTED (final), CLOSED (approved with no pickup) or APPROVED (a rider collects it:
// IN_TRANSIT once they have it).
export default (sequelize) => {
  const OrderReturn = sequelize.define(
    "OrderReturns",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      order_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      order_item_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      quantity: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false
      },
      source: {
        type: DataTypes.ENUM("FAILED_DELIVERY", "DOORSTEP", "CUSTOMER"),
        allowNull: false
      },
      reason: {
        type: DataTypes.STRING(30),
        allowNull: false
      },
      note: {
        type: DataTypes.TEXT
      },
      assignment_id: {
        type: DataTypes.UUID,
        allowNull: true // delivery-service owns it, so no FK
      },
      status: {
        type: DataTypes.ENUM("REQUESTED", "APPROVED", "REJECTED", "IN_TRANSIT", "RECEIVED", "CLOSED"),
        allowNull: false
      },
      restock_qty: {
        type: DataTypes.DECIMAL(12, 3)
      },
      write_off_qty: {
        type: DataTypes.DECIMAL(12, 3)
      },
      refund_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      refund_status: {
        type: DataTypes.ENUM("PENDING", "SENT", "DUE", "FAILED", "NOT_NEEDED"),
        allowNull: false,
        defaultValue: "PENDING"
      },
      refund_ref: {
        type: DataTypes.STRING(100)
      },
      received_at: {
        type: DataTypes.DATE
      },
      inspected_by: {
        type: DataTypes.BIGINT
      },
      inspected_at: {
        type: DataTypes.DATE
      },
      // The customer's photo (JPEG or PNG). Left out of every read but the photo route's.
      photo: {
        type: DataTypes.BLOB
      },
      // Staff only: the customer is told it doesn't meet the return terms.
      reject_reason: {
        type: DataTypes.STRING(20)
      },
      // A wrong item: the variant that was actually sent.
      sent_variant_id: {
        type: DataTypes.BIGINT
      },
      reviewed_by: {
        type: DataTypes.BIGINT
      },
      reviewed_at: {
        type: DataTypes.DATE
      }
    },
    {
      tableName: "order_returns",
      defaultScope: { attributes: { exclude: ["photo"] } },
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );

  OrderReturn.associate = (models) => {
    OrderReturn.belongsTo(models.Order, { foreignKey: "order_id", as: "order" });
    OrderReturn.belongsTo(models.OrderItem, { foreignKey: "order_item_id", as: "item" });
  };

  return OrderReturn;
};
