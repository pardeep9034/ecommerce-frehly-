import WarehouseRepository from "../repository/warehouse.repository.js";
import AppError from "../../utils/AppError.js";
import {env} from "../../config/env.js";
import { publisher } from "../../messaging/index.js";
import InventoryEvents from "../../messaging/events/inventory.events.js";
import logger from "../../utils/Logger.js";
import initializeModels from "../../models/index.js";
import { LOCATION_FIELDS, allowedUpdate, assertCanCreate, assertCanDelete, isSuperAdmin, sameValue } from "./warehouse.access.js";

// One spelling per city, so the Warehouses city filter doesn't list "mohali " and "MOHALI" apart: trimmed, single
// spaces, each word capitalised ("new delhi" -> "New Delhi"). Same rule as delivery-service's zone city.
const cityName = (city) =>
  typeof city === "string"
    ? city.trim().replace(/\s+/g, " ").toLowerCase().replace(/(^|[\s-])\p{L}/gu, (letter) => letter.toUpperCase())
    : city;

class WarehouseService {
  async getAllWarehouses(limit, offset, filters) {
    const {count,rows}= await WarehouseRepository.getAllWarehouses(limit, offset, filters);
    const totalPages = Math.ceil(count / limit);
    const currentPage = Math.ceil(offset / limit) + 1;
    return{
     warehouses:rows,
       pagination: {
          totalItems: count,
          totalPages,
          currentPage,
          limit,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        },
    }
  }

  async getWarehouseById(id) {
    const warehouse = await WarehouseRepository.getWarehouseById(id);
    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }
    return warehouse;
  }

  async getCities() {
    return { cities: await WarehouseRepository.getCities() };
  }

  // `caller`: { user, service, authorization } from the request; the rules are in warehouse.access.js.
  async createWarehouse(data, caller) {
    assertCanCreate(caller);
    if (data.city) data = { ...data, city: cityName(data.city) };
    // A draft is inactive and SETTING_UP; an inactive store with any other status is a deactivated one.
    if ((data.is_active === false || data.is_active === "false") && !data.operational_status) {
      data = { ...data, operational_status: "SETTING_UP" };
    }

    const zoneResponse=await fetch(`${env.API_GATEWAY_URL}/delivery-zones/${data.zone_id}`)
    if(!zoneResponse.ok){
      throw new AppError("zone not found",404);
    }
    const zone=await zoneResponse.json();
    if(!zone.success){
      throw new AppError("zone not found",404);
    }
    return await WarehouseRepository.createWarehouse(data);
  }

  async updateWarehouse(id, data, caller) {
    const warehouse = await this.getWarehouseById(id);
    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }
    if (data.city) data = { ...data, city: cityName(data.city) };
    const changes = allowedUpdate(caller, warehouse, data);
    // Going live from a draft opens the store unless the request says otherwise.
    if (changes.is_active === true && !warehouse.is_active && warehouse.operational_status === "SETTING_UP" && !changes.operational_status) {
      changes.operational_status = "OPEN";
    }
    const result = Object.keys(changes).length ? await WarehouseRepository.updateWarehouse(id, changes) : [0];

    // After the update, not awaited: a broker problem must never fail or slow the request.
    const who = { changedBy: caller.user?.user_id ?? null, changedByRole: caller.user?.role ?? null };
    const name = changes.name ?? warehouse.name;
    const oldStatus = warehouse.operational_status;
    if (changes.operational_status && changes.operational_status !== oldStatus) {
      publisher
        .publish(InventoryEvents.WAREHOUSE_STATUS_CHANGED, { warehouseId: warehouse.id, name, oldStatus, newStatus: changes.operational_status, ...who })
        .catch(() => logger.error(`Failed to publish warehouse.status.changed for warehouse ${warehouse.id}`));
    }
    const moved = LOCATION_FIELDS.filter((field) => field in changes && !sameValue(changes[field], warehouse[field]))
      .map((field) => ({ field, from: warehouse[field] ?? null, to: changes[field] ?? null }));
    if (moved.length && caller.user && !isSuperAdmin(caller.user)) {
      publisher
        .publish(InventoryEvents.WAREHOUSE_LOCATION_CHANGED, { warehouseId: warehouse.id, name, changes: moved, ...who })
        .catch(() => logger.error(`Failed to publish warehouse.location.changed for warehouse ${warehouse.id}`));
    }
    return result;
  }

  async deleteWarehouse(id, caller) {
    const warehouse = await this.getWarehouseById(id);
    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }
    assertCanDelete(caller, warehouse);
    await this.assertNoHistory(warehouse, caller.authorization);
    await WarehouseRepository.deleteWarehouse(id);
    return { deleted: true };
  }

  // A delete is a hard delete and other services hold warehouse ids with no foreign key, so a store with stock,
  // orders or staff is refused. Orders and staff are counted with the caller's own token (a super admin's); if
  // either service can't answer, the delete is refused rather than guessed.
  async assertNoHistory(warehouse, authorization) {
    const db = await initializeModels();
    const where = { where: { warehouse_id: warehouse.id } };
    const local = (await Promise.all([db.Inventory.count(where), db.StockMovement.count(where), db.StockReservation.count(where)]))
      .reduce((sum, count) => sum + count, 0);
    if (local) throw new AppError("This draft has stock records; deactivate it instead of deleting", 409);

    const count = async (path, what) => {
      let body;
      try {
        const response = await fetch(`${env.API_GATEWAY_URL}${path}`, { headers: { authorization }, signal: AbortSignal.timeout(5000) });
        body = response.ok ? await response.json() : null;
      } catch {
        body = null;
      }
      const total = body?.data?.pagination?.totalItems;
      if (!Number.isInteger(total)) throw new AppError(`Couldn't check this store's ${what}; try again`, 503);
      return total;
    };
    const [orders, staff] = await Promise.all([
      count(`/orders/admin/all?warehouse_id=${warehouse.id}&page=1&limit=1`, "orders"),
      count(`/auth/admin/users/staff?warehouse_id=${warehouse.id}&page=1&limit=1`, "staff"),
    ]);
    if (orders) throw new AppError("This draft has orders; deactivate it instead of deleting", 409);
    if (staff) throw new AppError("Staff are still assigned to this draft; move them first", 409);
  }
}

export default new WarehouseService();
