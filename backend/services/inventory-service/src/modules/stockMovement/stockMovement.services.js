import initializeModels from "../../models/index.js";
import InventoryRepository from "../repository/inventory.repository.js";
import StockMovementRepository from "../repository/stockMovement.repository.js";
import AppError from "../../utils/AppError.js";
import {env} from "../../config/env.js";



const INCREASE_TYPES = new Set(["STOCK_IN", "RETURN"]);
const DECREASE_TYPES = new Set(["SALE", "DAMAGE"]);

const fetchVariantDetails = async (variantId) => {
  try {
    const response = await fetch(
      `${env.API_GATEWAY_URL}/product-variant/variants/${variantId}`,
    );

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    throw new AppError(`Failed to fetch variant details: ${error.message}`, 500);
  }
};

const getCreatedBy = (user, fallbackCreatedBy) => {

  return user;
};

class StockMovementServices {
  async getAllStockMovements(limit, offset) {
    if (limit <= 0 || offset < 0) {
      throw new AppError(
        "Invalid limit or offset values. Limit must be greater than 0 and offset must be non-negative.",
        400,
      );
    }

    const { count, rows } =
      await StockMovementRepository.getAllStockMovements(limit, offset);
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(count / limit);

    return {
      stockMovements: rows,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage,
        limit,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    };
  }

  async getStockMovementById(id) {
    const stockMovement =
      await StockMovementRepository.getStockMovementById(id);

    if (!stockMovement) {
      throw new AppError("Stock movement not found", 404);
    }

    return stockMovement;
  }

  async getStockMovementsByVariantId(variantId, limit, offset) {
    if (!variantId) {
      throw new AppError("variantId is required", 400);
    }

    return await StockMovementRepository.getStockMovementsByVariantId(
      variantId,
      limit,
      offset,
    );
  }

  async createStockMovement(movementData, user) {
   
    const {
      variant_id,
      movement_type,
      quantity,
      reason,
      created_by,
      after_stock,
    } = movementData;
    const createdBy = getCreatedBy(user, created_by);

    if (!createdBy) {
      throw new AppError("created_by is required", 400);
    }

    const variantExists = await fetchVariantDetails(variant_id);
    if (!variantExists) {
      throw new AppError("Variant not found", 404);
    }

    const db = await initializeModels();

    return await db.sequelize.transaction(async (transaction) => {
      let inventory =
        await InventoryRepository.getInventoryByVariantId(variant_id, 0, 1);
      inventory = inventory?.rows?.[0] || null;

      if (!inventory && !INCREASE_TYPES.has(movement_type)) {
        throw new AppError("Inventory not found for this variant", 404);
      }

      if (!inventory) {
      // check variant exists before creating inventory
      const variantExists = await fetchVariantDetails(variant_id);
      if (!variantExists) {
        throw new AppError("Variant not found", 404);
      }
        inventory = await InventoryRepository.createInventory(
          {
            variant_id,
            current_stock: 0,
            reserved_stock: 0,
            last_stock_update_at: new Date(),
          },
          { transaction },
        );
      }

      const beforeStock = Number(inventory.current_stock || 0);
      let nextStock;

      if (INCREASE_TYPES.has(movement_type)) {
        nextStock = Number(beforeStock) + Number(quantity);
      } else if (DECREASE_TYPES.has(movement_type)) {
        if (quantity > beforeStock) {
          throw new AppError("Quantity exceeds current stock", 400);
        }
        nextStock = Number(beforeStock) - Number(quantity);
      } else if (movement_type === "ADJUSTMENT") {
        if (after_stock === undefined || after_stock === null) {
          throw new AppError("after_stock is required for ADJUSTMENT", 400);
        }
        nextStock = Number(after_stock);
      }

      const stockMovement =
        await StockMovementRepository.createStockMovement(
          {
            variant_id,
            movement_type,
            quantity,
            before_stock: beforeStock,
            after_stock: nextStock,
            reason,
            created_by: createdBy,
          },
          { transaction },
        );

      await InventoryRepository.updateInventory(
        inventory.id,
        {
          current_stock: nextStock,
          last_stock_update_at: new Date(),
        },
        { transaction },
      );

      const updatedInventory =
        await InventoryRepository.getInventoryById(inventory.id);

      return {
        stockMovement,
        inventory: updatedInventory,
      };
    });
  }
}

export default new StockMovementServices();
