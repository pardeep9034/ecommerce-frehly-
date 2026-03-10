import InventoryRepository from "../repository/inventory.repository.js";

const InventoryServices = {

  async getAllInventory(limit, offset) {

    if (limit) {
      if (offset !== undefined) {

        const repo = new InventoryRepository();
        const { count, rows } = await repo.getAllInventory(limit, offset).catch(() => null);

        if (rows) {

          const currentPage = Math.floor(offset / limit) + 1;
          const totalPages = Math.ceil(count / limit);

          return {
            success: true,
            data: {
              inventory: rows,
              pagination: {
                totalItems: count,
                totalPages,
                currentPage,
                limit,
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1
              }
            }
          };

        } else {
          return { success: false, message: "Unable to fetch inventory" };
        }

      } else {
        return { success: false, message: "Offset is required" };
      }
    } else {
      return { success: false, message: "Limit is required" };
    }

  },


  async getInventoryById(id) {

    if (id) {

      const repo = new InventoryRepository();
      const inventory = await repo.getInventoryById(id).catch(() => null);

      if (inventory) {

        return {
          success: true,
          data: inventory
        };

      } else {

        return {
          success: false,
          message: "Inventory record not found"
        };

      }

    } else {

      return {
        success: false,
        message: "Inventory id is required"
      };

    }

  },


  async getInventoryByVariantId(variantId) {

    if (variantId) {

      const repo = new InventoryRepository();
      const inventory = await repo.getInventoryByVariantId(variantId).catch(() => null);

      if (inventory) {

        return {
          success: true,
          data: inventory
        };

      } else {

        return {
          success: false,
          message: "Inventory not found for this variant"
        };

      }

    } else {

      return {
        success: false,
        message: "variantId is required"
      };

    }

  },


  async createInventory(inventoryData) {

    if (inventoryData) {

      if (inventoryData.variantId) {

        const repo = new InventoryRepository();

        const inventory = await repo.createInventory(inventoryData).catch(() => null);

        if (inventory) {

          return {
            success: true,
            data: inventory,
            message: "Inventory created successfully"
          };

        } else {

          return {
            success: false,
            message: "Unable to create inventory"
          };

        }

      } else {

        return {
          success: false,
          message: "variantId is required"
        };

      }

    } else {

      return {
        success: false,
        message: "Inventory data is required"
      };

    }

  },


  async updateInventory(id, inventoryData) {

    if (id) {

      if (inventoryData) {

        const repo = new InventoryRepository();

        const updated = await repo.updateInventory(id, inventoryData).catch(() => null);

        if (updated && updated[0]) {

          const updatedInventory = await repo.getInventoryById(id);

          return {
            success: true,
            data: updatedInventory,
            message: "Inventory updated successfully"
          };

        } else {

          return {
            success: false,
            message: "Inventory record not found or no changes made"
          };

        }

      } else {

        return {
          success: false,
          message: "Inventory data is required"
        };

      }

    } else {

      return {
        success: false,
        message: "Inventory id is required"
      };

    }

  },


  async increaseStock(variantId, quantity) {

    if (variantId) {

      if (quantity) {

        const repo = new InventoryRepository();

        const updated = await repo.increaseStock(variantId, quantity).catch(() => null);

        if (updated) {

          return {
            success: true,
            data: updated,
            message: "Stock increased successfully"
          };

        } else {

          return {
            success: false,
            message: "Inventory not found"
          };

        }

      } else {

        return {
          success: false,
          message: "Quantity is required"
        };

      }

    } else {

      return {
        success: false,
        message: "variantId is required"
      };

    }

  },


  async decreaseStock(variantId, quantity) {

    if (variantId) {

      if (quantity) {

        const repo = new InventoryRepository();

        const updated = await repo.decreaseStock(variantId, quantity).catch(() => null);

        if (updated) {

          return {
            success: true,
            data: updated,
            message: "Stock decreased successfully"
          };

        } else {

          return {
            success: false,
            message: "Inventory not found or insufficient stock"
          };

        }

      } else {

        return {
          success: false,
          message: "Quantity is required"
        };

      }

    } else {

      return {
        success: false,
        message: "variantId is required"
      };

    }

  },


  async deleteInventory(id) {

    if (id) {

      const repo = new InventoryRepository();

      const deleted = await repo.deleteInventory(id).catch(() => null);

      if (deleted) {

        return {
          success: true,
          message: "Inventory deleted successfully"
        };

      } else {

        return {
          success: false,
          message: "Inventory record not found"
        };

      }

    } else {

      return {
        success: false,
        message: "Inventory id is required"
      };

    }

  }

};

export default InventoryServices;