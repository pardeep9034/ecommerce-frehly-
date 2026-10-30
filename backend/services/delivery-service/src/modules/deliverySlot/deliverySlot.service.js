import DeliverySlotRepository from "../repository/deliverySlot.repository.js";
import AppError from "../../utils/AppError.js";

// "9:00" / "09:00" / "09:00:00" all compare as "09:00:00" (the TIME column's own shape).
const asTime = (value) => {
  const [h, m, s = "00"] = String(value).split(":");
  return `${h.padStart(2, "0")}:${m}:${s}`;
};

// ponytail: a slot is one same-day window (start before end), overnight slots and overlap checks are left out; add them
// if slots ever cross midnight or staff report clashing windows.
const assertWindow = (start, end) => {
  if (asTime(start) >= asTime(end)) throw new AppError("The slot must end after it starts", 400);
};

class DeliverySlotService {
  async getActiveDeliverySlots() {
    const { rows } = await DeliverySlotRepository.getAllDeliverySlots(100, 0);
    return rows.filter((slot) => slot.is_active);
  }

  // Staff list: active and switched-off slots, earliest first.
  async getAllDeliverySlots() {
    const { rows } = await DeliverySlotRepository.getAllDeliverySlots(100, 0);
    return rows;
  }

  async createDeliverySlot(data) {
    assertWindow(data.start_time, data.end_time);
    return await DeliverySlotRepository.createDeliverySlot({
      name: data.name,
      start_time: asTime(data.start_time),
      end_time: asTime(data.end_time),
      is_active: data.is_active ?? true
    });
  }

  // No delete: assignments keep pointing at their slot. Switching a slot off (is_active false) takes it off the assign screen.
  async updateDeliverySlot(id, data) {
    const slot = await DeliverySlotRepository.getDeliverySlotById(id);
    if (!slot) throw new AppError("Delivery slot not found", 404);

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.start_time !== undefined) updateData.start_time = asTime(data.start_time);
    if (data.end_time !== undefined) updateData.end_time = asTime(data.end_time);
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    assertWindow(updateData.start_time ?? slot.start_time, updateData.end_time ?? slot.end_time);

    await DeliverySlotRepository.updateDeliverySlot(id, updateData);
    return await DeliverySlotRepository.getDeliverySlotById(id);
  }
}

export default new DeliverySlotService();
