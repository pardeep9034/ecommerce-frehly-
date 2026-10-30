import { Op, literal } from "sequelize";

// A where clause for DeliveryPartner: not a rider still holding goods owed to the store (a failed drop, or items turned
// away at the door, not yet taken back with the return code). They get no new orders until the store has them.
// exceptOrderId: the order being retried with the same rider, who holds its goods on purpose.
// Assignments that ended before returns existed have no return_due_at, so they never block anyone.
export const notHoldingReturns = (exceptOrderId) => ({
  id: {
    [Op.notIn]: literal(
      `(SELECT delivery_partner_id FROM delivery_assignments WHERE return_due_at IS NOT NULL AND returned_at IS NULL${
        exceptOrderId ? ` AND order_id <> ${Number(exceptOrderId)}` : ""
      })`,
    ),
  },
});

// What goods a rider owes the store: a customer's return they collected, a whole failed order, or items turned away
// at the door of a delivered one.
export const returnKind = (assignment) =>
  assignment.kind === "RETURN_PICKUP" ? "CUSTOMER" : assignment.status === "FAILED" ? "FAILED_DELIVERY" : "DOORSTEP";
