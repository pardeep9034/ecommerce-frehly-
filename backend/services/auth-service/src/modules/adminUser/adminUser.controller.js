import adminUserService from "./adminUser.service.js";
import staffService from "./staff.service.js";
import ResponseUtil from "../../utils/response.js";

// Run the service, wrap the result, hand any error to the global handler. `message` may depend on the result.
const handle = (message, run, status = 200) => async (req, res, next) => {
  try {
    const result = await run(req);
    return ResponseUtil.success(res, result, typeof message === "function" ? message(result) : message, status);
  } catch (error) {
    return next(error);
  }
};

class AdminUserController {
  listCustomers = handle("Customers fetched successfully", (req) => adminUserService.listCustomers(req.query));

  // Customers and staff share this route; the service decides who may touch whom.
  setStatus = handle(
    (result) => `${result.role === "CUSTOMER" ? "Customer" : "User"} ${result.is_active ? "unblocked" : "blocked"}`,
    (req) => adminUserService.setStatus(req.params.id, req.body?.is_active, req.user)
  );

  listStaff = handle("Users fetched successfully", (req) => staffService.listStaff(req.query));
  getStaff = handle("User fetched successfully", (req) => staffService.getStaff(req.params.id));
  createStaff = handle("User created", (req) => staffService.createStaff(req.body, req.user.id), 201);
  updateStaff = handle("User updated", (req) => staffService.updateStaff(req.params.id, req.body, req.user.id));
  resetStaffPassword = handle("Password reset", (req) => staffService.resetPassword(req.params.id, req.body, req.user.id));
  resendStaffInvite = handle("Login details sent", (req) => staffService.resendInvite(req.params.id, req.user.id));
}

export default new AdminUserController();
