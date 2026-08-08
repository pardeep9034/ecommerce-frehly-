import initializeModels from "../../models/index.js";
import BaseRepository from "./baseRepository.js";

class InventoryRepository extends BaseRepository{
    constructor(){
        super("Inventory");
    }

  async getAllInventory(limit = 10, offset = 0) {
   
    return await this.findAndCountAll({},{  
      limit,
      offset,
      order: [["created_at", "DESC"]]
    });
  }

  async getInventoryById(id) {
   
    return await this.findById(id);
  }

  async getInventoryByVariantId(variantId,warehouseId, offset, limit) {
  return await this.findOne({variant_id: variantId,warehouse_id:warehouseId});
  }

  async getInventoryByVariantIdAndWarehouseId(variant_id,warehouse_id){
    return await this.findOne({variant_id,warehouse_id})
  }

  async createInventory(inventoryData, options = {}) {

    return await this.create(inventoryData, options);

  }


  async updateInventory(id, inventoryData, options = {}) {
    return await this.updateById(id,inventoryData, options);

  }


  async increaseStock(variantId, quantity) {

    const inventory = await this.findOne({variantId});

    if (!inventory) {
      return null;
    }

    const newStock = inventory.stock + quantity;

    return await this.updateById(inventory.id,{current_stock: newStock});

  }


  async decreaseStock(variantId, quantity) {

    const inventory = await this.findOne({variantId});

    if (!inventory) {
      return null;
    }

    if (inventory.stock < quantity) {
      throw new Error("Insufficient stock");
    }

    const newStock = inventory.stock - quantity;

    return await this.updateById(inventory.id,{current_stock: newStock});

  }


  async deleteInventory(id) {


    return await this.deleteById(id);

  }

}

export default new InventoryRepository ();
