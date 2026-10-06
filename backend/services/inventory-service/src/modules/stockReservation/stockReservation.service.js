import initializeModels from "../../models/index.js";
import InventoryRepository from "../repository/inventory.repository.js";
import StockReservationRepository from "../repository/stockReservation.repository.js";
import AppError from "../../utils/AppError.js";
import {env} from "../../config/env.js";



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

// Ids of the variants whose product name matches `search` (product-service owns names; it caps the list).
const fetchVariantIdsByProductName = async (search) => {
  try {
    const response = await fetch(
      `${env.API_GATEWAY_URL}/product-variant/variants/search?search=${encodeURIComponent(search)}`,
    );

    if (!response.ok) {
      throw new Error(`product-service returned ${response.status}`);
    }

    const result = await response.json();
    return (result.data?.rows ?? []).map((variant) => variant.id);
  } catch (error) {
    throw new AppError(`Failed to search variants: ${error.message}`, 502);
  }
};

const RESERVATION_STATUSES = ["ACTIVE", "CONFIRMED", "RELEASED", "EXPIRED"];

class StockReservationServices {
  async getAllStockReservations(limit, offset, { status, warehouse_id, search } = {}) {
    if (limit <= 0 || offset < 0) {
      throw new AppError(
        "Invalid limit or offset values. Limit must be greater than 0 and offset must be non-negative.",
        400,
      );
    }

    const wanted = status ? String(status).toUpperCase() : undefined;
    if (wanted && !RESERVATION_STATUSES.includes(wanted)) {
      throw new AppError(`status must be one of ${RESERVATION_STATUSES.join(", ")}`, 400);
    }

    const warehouseId = warehouse_id ? Number(warehouse_id) : undefined;
    if (warehouse_id && (!Number.isInteger(warehouseId) || warehouseId <= 0)) {
      throw new AppError("warehouse_id must be a positive number", 400);
    }

    const term = search ? String(search).trim().slice(0, 100) : "";
    const filters = {
      warehouseId,
      search: term || undefined,
      variantIds: term ? await fetchVariantIdsByProductName(term) : [],
    };

    const [{ count, rows }, statusCounts] = await Promise.all([
      StockReservationRepository.getAllStockReservations(limit, offset, { status: wanted, ...filters }),
      StockReservationRepository.countByStatus(filters),
    ]);
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(count / limit);

    return {
      stockReservations: rows,
      statusCounts,
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

  async getStockReservationById(id) {
    const reservation =
      await StockReservationRepository.getStockReservationById(id);

    if (!reservation) {
      throw new AppError("Stock reservation not found", 404);
    }

    return reservation;
  }

  async getStockReservationsByVariantId(variantId, limit, offset) {
    if (!variantId) {
      throw new AppError("variantId is required", 400);
    }

    return await StockReservationRepository.getStockReservationsByVariantId(
      variantId,
      limit,
      offset,
    );
  }

  async getStockReservationsByOrderId(orderId, limit, offset) {
    if (!orderId) {
      throw new AppError("orderId is required", 400);
    }

    return await StockReservationRepository.getStockReservationsByOrderId(
      orderId,
      limit,
      offset,
    );
  }

  async createStockReservation(reservationData) {
    const { order_id, variant_id,warehouse_id, quantity, expires_at } = reservationData;

    const variantExists = await fetchVariantDetails(variant_id);
    if (!variantExists) {
      throw new AppError("Variant not found", 404);
    }

    const db = await initializeModels();

    return await db.sequelize.transaction(async (transaction) => {
     const inventoryModel =
  await InventoryRepository.getInventoryByVariantIdAndWarehouseId(
    variant_id,
    warehouse_id,
    { transaction, lock: transaction.LOCK.UPDATE }
  );

if (!inventoryModel) {
  throw new AppError("Inventory not found for this variant", 404);
}

const inventory = inventoryModel.toJSON();

      if (!inventory) {
        throw new AppError("Inventory not found for this variant", 404);
      }

      const currentStock = Number(inventory.current_stock || 0);
      const reservedStock = Number(inventory.reserved_stock || 0);
      const availableStock = currentStock - reservedStock;

      if (quantity > availableStock) {
        throw new AppError("Insufficient available stock", 400);
      }

      const reservation =
        await StockReservationRepository.createStockReservation(
          {
            order_id,
            variant_id,
            warehouse_id,
            quantity,
            status: "ACTIVE",
            expires_at,
          },
          { transaction },
        );

      await InventoryRepository.updateInventory(
        inventory.id,
        {
          reserved_stock: reservedStock + quantity,
          last_stock_update_at: new Date(),
        },
        { transaction },
      );

      const updatedInventory =
        await InventoryRepository.getInventoryById(inventory.id);

      return {
        stockReservation: reservation,
        inventory: updatedInventory,
      };
    });
  }

  async confirmStockReservation(id, warehouseId) {
    return await this.updateReservationStatus(id, "CONFIRMED", warehouseId);
  }

  async releaseStockReservation(id, warehouseId) {
    return await this.updateReservationStatus(id, "RELEASED", warehouseId);
  }

  async expireStockReservation(id, warehouseId) {
    return await this.updateReservationStatus(id, "EXPIRED", warehouseId );
  }

  async updateReservationStatus(id, nextStatus, warehouseId = null) {
    const db = await initializeModels();

    return await db.sequelize.transaction(async (transaction) => {
      const reservation =
        await StockReservationRepository.getStockReservationById(id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

      if (!reservation) {
        throw new AppError("Stock reservation not found", 404);
      }

      if (reservation.status !== "ACTIVE") {
        throw new AppError(
          `Only ACTIVE reservations can be changed. Current status is ${reservation.status}`,
          400,
        );
      }

      let inventory =
        await InventoryRepository.getInventoryByVariantId(
          reservation.variant_id,
          reservation.warehouse_id,
          0,
          1,
          { transaction, lock: transaction.LOCK.UPDATE },
        );
   

      if (!inventory) {
        throw new AppError("Inventory not found for this variant", 404);
      }

      const quantity = Number(reservation.quantity || 0);
      const currentStock = Number(inventory.current_stock || 0);
      const reservedStock = Number(inventory.reserved_stock || 0);
      const nextReservedStock = Math.max(reservedStock - quantity, 0);
      const nextCurrentStock =
        nextStatus === "CONFIRMED" ? currentStock - quantity : currentStock;

      if (nextCurrentStock < 0) {
        throw new AppError("Insufficient current stock", 400);
      }

      await StockReservationRepository.updateStockReservation(
        id,
        { status: nextStatus },
        { transaction },
      );

      await InventoryRepository.updateInventory(
        inventory.id,
        {
          current_stock: nextCurrentStock,
          reserved_stock: nextReservedStock,
          last_stock_update_at: new Date(),
        },
        { transaction },
      );

      const updatedReservation =
        await StockReservationRepository.getStockReservationById(id);
      const updatedInventory =
        await InventoryRepository.getInventoryById(inventory.id);

      return {
        stockReservation: updatedReservation,
        inventory: updatedInventory,
      };
    });
  }
}

export default new StockReservationServices();
