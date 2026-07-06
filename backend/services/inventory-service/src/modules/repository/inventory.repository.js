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

  async getInventoryByVariantId(variantId) {
  return await this.findOne({variantId});
  }

  async createInventory(inventoryData) {

    return await this.create(inventoryData);

  }


  async updateInventory(id, inventoryData) {
    return await this.updateById(id,inventoryData);

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

export default InventoryRepository;
