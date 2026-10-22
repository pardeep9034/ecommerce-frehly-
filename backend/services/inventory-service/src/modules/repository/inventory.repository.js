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

  // Stock health per (variant, warehouse) row, one warehouse or all. Measured on what is free to sell
  // (current_stock - reserved_stock): low is 1..low_stock_threshold, out is 0 or less. A product short in
  // two warehouses counts twice, since each warehouse restocks on its own.
  async stockSummary(warehouseId) {
    const Model = await this.getModel();
    const [row] = await Model.sequelize.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE current_stock - reserved_stock > 0
                                 AND current_stock - reserved_stock <= low_stock_threshold)::int AS low,
              COUNT(*) FILTER (WHERE current_stock - reserved_stock <= 0)::int AS out,
              COALESCE(SUM(reserved_stock), 0)::int AS reserved
         FROM inventory
        WHERE (CAST(:warehouseId AS bigint) IS NULL OR warehouse_id = CAST(:warehouseId AS bigint))`,
      { replacements: { warehouseId: warehouseId ?? null }, type: Model.sequelize.QueryTypes.SELECT },
    );
    return row;
  }

  async getInventoryById(id) {
   
    return await this.findById(id);
  }

  async getInventoryByVariantId(variantId,warehouseId, offset, limit, options = {}) {
  return await this.findOne({variant_id: variantId,warehouse_id:warehouseId}, options);
  }

  async getInventoryByWarehouse(warehouseId, limit = 10, offset = 0) {
    return await this.findAndCountAll({ warehouse_id: warehouseId }, {
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });
  }

  async getInventoryByVariantIdAndWarehouseId(variant_id,warehouse_id, options = {}){
    return await this.findOne({variant_id,warehouse_id}, options)
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
