import InventoryRepository from "../repository/inventory.repository.js";
import ResponseUtil from "../../utils/response.js";
import AppError from "../../utils/appError.js";

const fetchVariantDetails = async (variantId) => {
  try {
    const variantResponse = await fetch(
      `http://localhost:3002/product-variant/variants/${variantId}`,
    );
    if (variantResponse.ok) {
      const result = await variantResponse.json();
      return result.data;
    }
    return null;
  } catch (error) {
    throw new AppError(
      `Failed to fetch variant details: ${error.message}`,
      500,
    );
  }
};

class InventoryServices {

  async getAllInventory(limit, offset) {
    try {
      if (limit <= 0 || offset < 0) {
        throw new AppError(
          "Invalid limit or offset values. Limit must be greater than 0 and offset must be non-negative.",
        );
      }

      const { count, rows } = await InventoryRepository.getAllInventory(
        limit,
        offset,
      );

      const inventoryWithVariants = await Promise.all(
        rows.map(async (item) => {
          const itemJson = item.toJSON();
          itemJson.variant = await fetchVariantDetails(item.variant_id);
          return itemJson;
        }),
      );

      const currentPage = Math.floor(offset / limit) + 1;
      const totalPages = Math.ceil(count / limit);

      return {
        inventory: inventoryWithVariants,
        pagination: {
          totalItems: count,
          totalPages,
          currentPage,
          limit,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        },
      };
    } catch (error) {
      throw new AppError(`Failed to fetch inventory: ${error.message}`, 500);
    }
  }

  async getInventoryById(id) {
    try {
      const inventory = await InventoryRepository.getInventoryById(id);

      if (!inventory) {
        throw new AppError("Inventory not found", 404);
      }

      const inventoryJson = inventory.toJSON();
      inventoryJson.variant = await fetchVariantDetails(inventory.variant_id);

      return inventoryJson;
    } catch (error) {
      throw new AppError(
        `Failed to fetch inventory by id: ${error.message}`,error.statusCode || 500,
      );
    }
  }

  async getInventoryByVariantId(variantId, offset, limit) {
    try {
      if (!variantId) {
        throw new AppError("variantId is required", 400);
      }

      const inventory = await InventoryRepository.getInventoryByVariantId(
        variantId,
        offset,
        limit,
      );

      if (!inventory) {
        throw new AppError("Inventory not found for this variant", 404);
      }

      return inventory.rows;
    } catch (error) {
      throw new AppError(
        `Failed to fetch inventory by variantId: ${error.message}`,
        500,
      );
    }
  }

  async createInventory(inventoryData) {
    try {
      if (inventoryData.variant_id) {
        const variantexists = await fetchVariantDetails(
          inventoryData.variant_id,
        );
        const existingInventory =
          await InventoryRepository.getInventoryByVariantId(
            inventoryData.variant_id,
            0,
            1,
          );

        if (!variantexists) {
          throw new AppError("Variant does not exist", 404);
        }
        if (existingInventory && existingInventory.count > 0) {
          throw new AppError("Inventory for this variant already exists", 400);
        }

        const inventory = await InventoryRepository.createInventory(
          inventoryData,
        );
        return inventory;
      }
    } catch (error) {
      throw new AppError(`Failed to create inventory: ${error.message}`, 500);
    }
  }

  async updateInventory(id, inventoryData) {
    try {
      if (!id) {
        throw new AppError("Inventory id is required", 400);
      }

      const variantExists = await fetchVariantDetails(inventoryData.variant_id);

      if (!variantExists) {
        throw new AppError("Variant does not exist", 404);
      }
      const existingInventory = await InventoryRepository.getInventoryById(id);

      const updated = await InventoryRepository.updateInventory(
        id,
        inventoryData,
      );
    } catch (error) {
      throw new AppError(`Failed to update inventory: ${error.message}`, 500);
    }
  }

  async increaseStock(variantId, quantity) {
    if (variantId) {
      if (quantity) {
        const repo = new InventoryRepository();

        const updated = await repo
          .increaseStock(variantId, quantity)
          .catch(() => null);

        if (updated) {
          return {
            success: true,
            data: updated,
            message: "Stock increased successfully",
          };
        } else {
          return {
            success: false,
            message: "Inventory not found",
          };
        }
      } else {
        return {
          success: false,
          message: "Quantity is required",
        };
      }
    } else {
      return {
        success: false,
        message: "variantId is required",
      };
    }
  }

  async decreaseStock(variantId, quantity) {
    if (variantId) {
      if (quantity) {
        const repo = new InventoryRepository();

        const updated = await repo
          .decreaseStock(variantId, quantity)
          .catch(() => null);

        if (updated) {
          return {
            success: true,
            data: updated,
            message: "Stock decreased successfully",
          };
        } else {
          return {
            success: false,
            message: "Inventory not found or insufficient stock",
          };
        }
      } else {
        return {
          success: false,
          message: "Quantity is required",
        };
      }
    } else {
      return {
        success: false,
        message: "variantId is required",
      };
    }
  }

  async deleteInventory(id) {
    try {
      if (id) {
        throw new AppError("Inventory id is required", 400);
      }

      const deleted = await InventoryRepository.deleteInventory(id);
      return deleted;
    } catch (error) {
      throw new AppError(`Failed to delete inventory: ${error.message}`, 500);
    }
  }
}

export default new InventoryServices();
