import WarehouseRepository from "../repository/warehouse.repository.js";
import AppError from "../../utils/appError.js";

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
