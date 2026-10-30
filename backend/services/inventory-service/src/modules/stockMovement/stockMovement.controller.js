import StockMovementServices from "./stockMovement.service.js";
import ResponseUtil from "../../utils/response.js";
import { ownStore, assertOwnStore, assertEveryStore, assertManagesStock } from "../warehouse/warehouse.access.js";

class StockMovementController {
  async getAllStockMovements(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const filters = {};
      if (req.query.type) filters.movement_type = req.query.type;
      if (req.query.warehouse_id) filters.warehouse_id = Number(req.query.warehouse_id);
      const own = ownStore(req);
      if (own !== null) filters.warehouse_id = own;

      const result = await StockMovementServices.getAllStockMovements(
        limit,
        offset,
        filters,
      );

      return ResponseUtil.success(
        res,
        result,
        "Stock movements fetched successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getStockMovementById(req, res, next) {
    try {
      const result = await StockMovementServices.getStockMovementById(
        req.params.id,
      );
      assertOwnStore(req, result.warehouse_id);

      return ResponseUtil.success(
        res,
        result,
        "Stock movement fetched successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getStockMovementsByVariantId(req, res, next) {
    try {
      assertEveryStore(req);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const result =
        await StockMovementServices.getStockMovementsByVariantId(
          req.params.variantId,
          limit,
          offset,
        );

      return ResponseUtil.success(
        res,
        result,
        "Stock movements fetched successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async createStockMovement(req, res, next) {
    try {
      assertManagesStock(req, req.body.warehouse_id);
      const result = await StockMovementServices.createStockMovement(
        req.body,
        req.user?.user_id, // none on a service call (x-internal-key): the body's created_by is used
        { addsMissingItem: Boolean(req.service) }, // staff add items through POST /inventory instead
      );

      return ResponseUtil.success(
        res,
        result,
        "Stock movement created successfully",
        201,
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new StockMovementController();
