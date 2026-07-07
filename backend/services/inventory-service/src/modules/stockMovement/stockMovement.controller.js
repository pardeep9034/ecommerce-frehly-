import StockMovementServices from "./stockMovement.services.js";
import ResponseUtil from "../../utils/response.js";

class StockMovementController {
  async getAllStockMovements(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const result = await StockMovementServices.getAllStockMovements(
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

  async getStockMovementById(req, res, next) {
    try {
      const result = await StockMovementServices.getStockMovementById(
        req.params.id,
      );

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
      console.log("req.user in createStockMovement:", req.user);
      const result = await StockMovementServices.createStockMovement(
        req.body,
        req.user,
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
