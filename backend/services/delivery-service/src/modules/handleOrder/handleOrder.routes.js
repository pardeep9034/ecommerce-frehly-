import express from "express";
import HandleOrderController from"./handleOrder.controller.js";
import { authenticateToken, requireRole, requireActivePartner } from "../../middleware/auth.js";
import { STAFF_ROLES,ROLES } from "../../constants/roles.js";
import validate, { uuidParam } from "../../middleware/validate.js";

const router = express.Router();
const requireDispatchRole = requireRole(STAFF_ROLES);
// Staff, or an active delivery partner. A partner's row lands on req.partner and the service limits them to their own work.
const requireStaffOrActivePartner = (req, res, next) =>
  req.user?.role === ROLES.DELIVERY_PARTNER ? requireActivePartner(req, res, next) : requireDispatchRole(req, res, next);

router.post( "/assignments/assign", authenticateToken, requireDispatchRole, validate("assignOrderSchema"), HandleOrderController.assignOrder);
// A rider sent to a customer to collect their approved returns (then to the store, with the return code).
router.post("/assignments/assign-pickup", authenticateToken, requireDispatchRole, validate("assignPickupSchema"), HandleOrderController.assignPickup);
router.post("/assignments/:assignmentId/re-aasign",authenticateToken,requireDispatchRole,validate("reAssignOrderSchema"),HandleOrderController.reAssignOrder)
// Handover between partners: request, then the first partner confirms, then the second confirms receipt.
router.post("/assignments/:assignmentId/handover",authenticateToken,requireStaffOrActivePartner,uuidParam("assignmentId"),validate("handOverSchema"),HandleOrderController.handOver)
router.post("/partner/handover/:id/confirm-handover",authenticateToken,requireStaffOrActivePartner,uuidParam(),validate("handoverConfirmSchema"),HandleOrderController.confirmHandover )
router.post("/partner/handover/:id/confirm-receipt",authenticateToken,requireStaffOrActivePartner,uuidParam(),validate("handoverConfirmSchema"),HandleOrderController.confirmReciept)
// Either partner calls it off before the receipt (the receiver declines, the giver withdraws). No body.
router.post("/partner/handover/:id/cancel",authenticateToken,requireStaffOrActivePartner,uuidParam(),HandleOrderController.cancelHandover)
router.post("/assignments/:assignmentId/update-status",authenticateToken,requireDispatchRole,HandleOrderController.updateStatus)
// Who is delivering this order (the admin order page). Staff only: it holds the partner's phone.
router.get("/assignments/by-order/:orderId",authenticateToken,requireDispatchRole,HandleOrderController.getAssignmentByOrder)
// Goods riders owe the store (failed drops, items turned away at the door): the list, taking them back with the
// rider's return code, and the rider's photo of what was turned away. Store staff: their own store only.
router.get("/returns-due",authenticateToken,requireDispatchRole,HandleOrderController.listReturnsDue)
router.post("/assignments/:assignmentId/returned",authenticateToken,requireDispatchRole,uuidParam("assignmentId"),validate("returnReceivedSchema"),HandleOrderController.receiveReturn)
router.get("/assignments/:assignmentId/door-photo",authenticateToken,requireDispatchRole,uuidParam("assignmentId"),HandleOrderController.getDoorPhoto)
export default router;
