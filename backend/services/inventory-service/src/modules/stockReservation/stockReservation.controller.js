import StockReservationServices from "./stockReservation.services.js";
import ResponseUtil from "../../utils/response.js";

class StockReservationController {
  async getAllStockReservations(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const result = await StockReservationServices.getAllStockReservations(
        limit,
        offset,
      );

      return ResponseUtil.success(
        res,
        result,
        "Stock reservations fetched successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getStockReservationById(req, res, next) {
    try {
      const result = await StockReservationServices.getStockReservationById(
        req.params.id,
      );

      return ResponseUtil.success(
        res,
        result,
        "Stock reservation fetched successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getStockReservationsByVariantId(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const result =
        await StockReservationServices.getStockReservationsByVariantId(
          req.params.variantId,
          limit,
          offset,
        );

      return ResponseUtil.success(
        res,
        result,
        "Stock reservations fetched successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getStockReservationsByOrderId(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const result =
        await StockReservationServices.getStockReservationsByOrderId(
          req.params.orderId,
          limit,
          offset,
        );

      return ResponseUtil.success(
        res,
        result,
        "Stock reservations fetched successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async createStockReservation(req, res, next) {
    try {
      const result = await StockReservationServices.createStockReservation(
        req.body,
      );

      return ResponseUtil.success(
        res,
        result,
        "Stock reservation created successfully",
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  async confirmStockReservation(req, res, next) {
    try {
      const result = await StockReservationServices.confirmStockReservation(
        req.params.id,
      );

      return ResponseUtil.success(
        res,
        result,
        "Stock reservation confirmed successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async releaseStockReservation(req, res, next) {
    try {
      const result = await StockReservationServices.releaseStockReservation(
        req.params.id,
      );

      return ResponseUtil.success(
        res,
        result,
        "Stock reservation released successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async expireStockReservation(req, res, next) {
    try {
      const result = await StockReservationServices.expireStockReservation(
        req.params.id,
      );

      return ResponseUtil.success(
        res,
        result,
        "Stock reservation expired successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new StockReservationController();
