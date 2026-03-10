import CategoryRepository from "../repository/category.repository.js";
import CategoryService from "./category.service.js";
import ResponseUtil from "../../utils/response.js";

const categoryService = new CategoryService(new CategoryRepository());
const CategoryController = {

  async createCategory(req, res) {

    const categoryData = req.body;

    if (categoryData) {

    
      const result = await categoryService.createCategory(categoryData);

      if (result.success) {

        return ResponseUtil.success(
          res,
          result.data,
          "Category created successfully",
          201
        );

      } else {

        return ResponseUtil.error(res, result.message, 500);

      }

    } else {

      return ResponseUtil.validationError(res, "Invalid category data");

    }

  },

  async getAllCategories(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
      const result = await categoryService.getAllCategories({ offset, limit });
     if (result.success) {

        return ResponseUtil.success(
          res,
          result.data,
          "Categories retrieved successfully"
        );

      } else {

        return ResponseUtil.error(res, result.message, 500);

      }
    } catch (error) {
      return ResponseUtil.error(res, "Failed to retrieve categories", 500);
    }
  },

  async updateCategory(req, res) {
    const { id } = req.params;
    const categoryData = req.body;

    if (categoryData) {

      const result = await categoryService.updateCategory(id, categoryData);

      if (result.success) {

        return ResponseUtil.success(
          res,
          result.data,
          "Category updated successfully"
        );

      } else {

        return ResponseUtil.error(res, result.message, 500);

      }

    } else {

      return ResponseUtil.validationError(res, "Invalid category data");

    }
  },

  async deleteCategory(req, res) {
    const { id } = req.params;

    if (id) {

      const result = await categoryService.deleteCategory(id);

      if (result.success) {

        return ResponseUtil.success(
          res,
          result.data,
          "Category deleted successfully"
        );

      } else {

        return ResponseUtil.error(res, result.message, 500);

      }

    } else {

      return ResponseUtil.validationError(res, "Invalid category data");

    }
  }

};

export default CategoryController;