import { initializeModels } from "../../models/index.js";

class InventoryRepository {

  async getAllInventory(limit = 10, offset = 0) {
    const db = await initializeModels();
    return await db.Inventory.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]]
    });
  }

  async getInventoryById(id) {
    const db = await initializeModels();
    return await db.Inventory.findByPk(id);
  }

  async getInventoryByVariantId(variantId) {
    const db = await initializeModels();
    return await db.Inventory.findOne({
      where: { variantId }
    });
  }

  async getInventoryByProductId(productId, variantId) {
    // Note: Since Inventory doesn't know about productId, this method relies on variantId or 
    // requires variantIds to be fetched from product-service first.
    const db = await initializeModels();
    const where = {};
    if (variantId) where.variantId = variantId;

    return await db.Inventory.findAll({
      where
    });
  }


  async createInventory(inventoryData) {

    const db = await initializeModels();

    return await db.Inventory.create(inventoryData);

  }


  async updateInventory(id, inventoryData) {

    const db = await initializeModels();

    return await db.Inventory.update(
      inventoryData,
      {
        where: { id }
      }
    );

  }


  async increaseStock(variantId, quantity) {

    const db = await initializeModels();

    const inventory = await db.Inventory.findOne({
      where: { variantId }
    });

    if (!inventory) {
      return null;
    }

    const newStock = inventory.stock + quantity;

    return await inventory.update({
      stock: newStock
    });

  }


  async decreaseStock(variantId, quantity) {

    const db = await initializeModels();

    const inventory = await db.Inventory.findOne({
      where: { variantId }
    });

    if (!inventory) {
      return null;
    }

    if (inventory.stock < quantity) {
      throw new Error("Insufficient stock");
    }

    const newStock = inventory.stock - quantity;

    return await inventory.update({
      stock: newStock
    });

  }


  async deleteInventory(id) {

    const db = await initializeModels();

    return await db.Inventory.destroy({
      where: { id }
    });

  }

}

export default InventoryRepository;
