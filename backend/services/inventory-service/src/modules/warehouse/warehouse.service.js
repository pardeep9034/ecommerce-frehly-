import WarehouseRepository from "../repository/warehouse.repository.js";
import AppError from "../../utils/AppError.js";
import {env} from "../../config/env.js";

class WarehouseService {
  async getAllWarehouses(limit, offset) {
    const {count,rows}= await WarehouseRepository.getAllWarehouses(limit, offset);
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

  async createWarehouse(data) {
    
    const zoneResponse=await fetch(`${env.API_GATEWAY_URL}/delivery-zones/${data.zone_id}`)
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
