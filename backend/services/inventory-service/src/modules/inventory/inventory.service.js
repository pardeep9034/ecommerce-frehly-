import InventoryRepository from "../repository/inventory.repository.js";
import StockMovementRepository from "../repository/stockMovement.repository.js";
import initializeModels from "../../models/index.js";
import ResponseUtil from "../../utils/response.js";
import AppError from "../../utils/AppError.js";
import { consumer } from "../../messaging/index.js";
import queues from "../../messaging/topology/queues.js";
import { initializeTopology } from "../../messaging/index.js";
import {env} from "../../config/env.js";
import inventoryRepository from "../repository/inventory.repository.js";
import logger from "../../utils/Logger.js";
// The API must not wait for the broker: retry until it is up. Once consuming, a lost connection exits and the
// restart brings the consumer back (design D10).
void (async () => {
  for (;;) {
    try {
      await initializeTopology();
      await consumer.subscribe(queues.INVENTORY_ORDER_QUEUE.name, async (event) => {
        logger.debug("event consumed");
      });
      return logger.info("✅ Inventory Service: RabbitMQ topology initialized");
    } catch (err) {
      logger.warn(`Inventory Service: RabbitMQ not ready (${err.message}), retrying in 5 s`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
})();

const fetchVariantDetails = async (variantId) => {
  try {
    const variantResponse = await fetch(
      `${env.API_GATEWAY_URL}/product-variant/variants/${variantId}`,
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
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to fetch inventory: ${error.message}`, 500);
    }
  }

  // { total, low, out, reserved } for the Overview card and the Inventory page stat cards.
  async getStockSummary(warehouseId) {
    return await InventoryRepository.stockSummary(warehouseId);
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
      if (error instanceof AppError) throw error;
      throw new AppError(
        `Failed to fetch inventory by id: ${error.message}`, 500,
      );
    }
  }

  async getInventoryByVariantId(variantId,warehouseId, offset, limit) {
    try {
      if (!variantId) {
        throw new AppError("variantId is required", 400);
      }

      const inventory = await InventoryRepository.getInventoryByVariantId(
        variantId,
        warehouseId,
        offset,
        limit,
      );

      if (!inventory) {
        throw new AppError("Inventory not found for this variant", 404);
      }

      return inventory;
    } catch (error) {
    if (error instanceof AppError) {
        throw error;
    }

      throw new AppError(
        `Failed to fetch inventory by variantId`,500,
      );
    }
  }
  async getInventoryByWarehouseId(warehouseId, offset = 0, limit = 10) {
    try {
      if (!warehouseId) {
        throw new AppError("warehouseId is required", 400);
      }

      const { count, rows } = await InventoryRepository.getInventoryByWarehouse(
        warehouseId,
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
      throw new AppError(`Failed to fetch inventory by warehouse: ${error.message}`, 500);
    }
  }
  async inventoryValidate(variantIds,warehouseId){
    if(variantIds.length ===0){
      throw new AppError("variantIds not  found")
    }
    if(!warehouseId){
      throw new AppError("warehouse not found")
    }
    const inventories= await inventoryRepository.findAll({variant_id:variantIds,warehouse_id:warehouseId})
  if(!inventories){
    throw new  AppError("inventory not fount for variants")
  }
  return inventories;
  }

  // [{ variant_id, available }] for the variants this store carries; a variant it doesn't carry is left out, so the
  // shop hides it, while a carried one at 0 shows as Out of stock. Whether it is on sale (ACTIVE) is the catalog's.
  async getStoreStock(variantIds, warehouseId) {
    if (!variantIds.length) return [];
    const inventories = await inventoryRepository.findAll({ variant_id: variantIds, warehouse_id: warehouseId });
    return inventories.map((inv) => ({
      variant_id: Number(inv.variant_id),
      available: Math.max(0, inv.current_stock - inv.reserved_stock),
    }));
  }

  async getInStockVariantIds(variantIds, warehouseId) {
    if (!variantIds?.length) return [];
    if (!warehouseId) {
      throw new AppError("warehouse not found");
    }
    const inventories = await inventoryRepository.findAll({ variant_id: variantIds, warehouse_id: warehouseId });
    return inventories
      .filter((inv) => inv.current_stock - inv.reserved_stock > 0)
      .map((inv) => inv.variant_id);
  }

  // Adds a catalog variant to a store. Only an ACTIVE variant of an ACTIVE product can be added. The row starts at 0
  // and the opening count is recorded as a STOCK_IN movement by `createdBy`, in one transaction.
  async createInventory({ variant_id, warehouse_id, opening_stock = 0, low_stock_threshold }, createdBy) {
    try {
      const variant = await fetchVariantDetails(variant_id);
      if (!variant) {
        throw new AppError("Variant does not exist", 404);
      }
      if (variant.status !== "ACTIVE" || variant.product?.status !== "ACTIVE") {
        throw new AppError("Only an active product and variant can be added to a store", 409);
      }
      if (await InventoryRepository.getInventoryByVariantIdAndWarehouseId(variant_id, warehouse_id)) {
        throw new AppError("This item is already in this store", 409);
      }
      if (opening_stock > 0 && !createdBy) {
        throw new AppError("created_by is required to record opening stock", 400);
      }

      const db = await initializeModels();
      return await db.sequelize.transaction(async (transaction) => {
        const now = new Date();
        const inventory = await InventoryRepository.createInventory(
          {
            variant_id,
            warehouse_id,
            current_stock: opening_stock,
            reserved_stock: 0,
            ...(low_stock_threshold !== undefined && { low_stock_threshold }),
            last_stock_update_at: now,
          },
          { transaction },
        );
        if (opening_stock > 0) {
          await StockMovementRepository.createStockMovement(
            {
              variant_id,
              warehouse_id,
              movement_type: "STOCK_IN",
              quantity: opening_stock,
              before_stock: 0,
              after_stock: opening_stock,
              reason: "Opening stock",
              created_by: createdBy,
            },
            { transaction },
          );
        }
        return inventory;
      });
    } catch (error) {
        if (error instanceof AppError) throw error;
            throw new AppError(error.message || "Failed to create inventory", 500);
    }
  }

  async updateInventory(id, inventoryData) {
    try {
      if (!id) {
        throw new AppError("Inventory id is required", 400);
      }

      const updated = await InventoryRepository.updateInventory(
        id,
        inventoryData,
      );
      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
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
      if (!id) {
        throw new AppError("Inventory id is required", 400);
      }

      const deleted = await InventoryRepository.deleteInventory(id);
      return deleted;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to delete inventory: ${error.message}`, 500);
    }
  }
}

export default new InventoryServices();
