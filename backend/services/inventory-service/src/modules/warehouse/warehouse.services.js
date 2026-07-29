import WarehouseRepository from "../repository/warehouse.repository.js";
import AppError from "../../utils/appError.js";
import { env } from "../../config/env.js";

class WarehouseService {
  async getAllWarehouses(limit, offset) {
    return await WarehouseRepository.getAllWarehouses(limit, offset);
  }

  async getWarehouseById(id) {
    const warehouse = await WarehouseRepository.getWarehouseById(id);
    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }
    return warehouse;
  }

  async createWarehouse(data) {
    
    const zoneResponse=await fetch(`${env.DELIVERY_SERVICE_URL}/delivery-zones/${data.zone_id}`)
    // console.log(zoneResponse)
    if(!zoneResponse.ok){
      throw new AppError("zone not found",404);
    }
    const zone=await zoneResponse.json();
    if(!zone.success){
      throw new AppError("zone not found",404);
    }
    return await WarehouseRepository.createWarehouse(data);
  }

  async updateWarehouse(id, data) {
    const warehouse = await this.getWarehouseById(id);
    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }
    return await WarehouseRepository.updateWarehouse(id, data);
  }

  async deleteWarehouse(id) {
    const warehouse = await this.getWarehouseById(id);
    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }
    await WarehouseRepository.deleteWarehouse(id);
    return { deleted: true };
  }
}

export default new WarehouseService();
