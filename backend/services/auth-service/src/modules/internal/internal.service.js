import UserRepository from "../repository/user.repository.js";
import AppError from "../../utils/AppError.js";
import { accountState } from "../auth/accountState.js";

class InternalService {
  // Called by delivery-service when an admin creates a partner. The auth user is the login identity:
  // the partner later signs up with this number (role DELIVERY_PARTNER) and sets a password.
  async findOrCreatePartnerUser({ phone, name }) {
    const existing = await UserRepository.findByPhone(phone);

    if (existing) {
      // One role per number: a customer or staff number can never become a partner.
      if (existing.role !== "DELIVERY_PARTNER") {
        throw new AppError("This number is already registered for a different account type.", 409);
      }
      // registered: they can already sign in, so the caller sends no "sign up" invite.
      return { user_id: existing.id, registered: accountState(existing) === "ACTIVE" };
    }

    // ponytail: check-then-create; two simultaneous calls for a new number hit the unique phone index
    // and the global handler answers 409. Retry in the caller if that ever matters.
    const user = await UserRepository.create({ phone, first_name: name.trim(), role: "DELIVERY_PARTNER" });
    return { user_id: user.id, registered: false };
  }
}

export default new InternalService();
