import CategoryService from "./category.service.js";
import ResponseUtil from "../../utils/response.js";



class CategoryController {

  async createCategory(req, res, next) {
    try {
      const categoryData = req.body;
      const result = await CategoryService.createCategory(categoryData);
      return ResponseUtil.success(
        res,
        result,
        "Category created successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async getAllCategories(req, res,next) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
      const result = await CategoryService.getAllCategories({ offset, limit });

        return ResponseUtil.success(
          res,
          result,
          "Categories retrieved successfully"
        );

    } catch (error) {
next(error);
    }
  }
  async getCategorySelection(req,res,next){
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    try{
      const result=await CategoryService.getCategorySelection({offset,limit,search});
      return ResponseUtil.success(res,result,"category selection retrieved successfully",200)
    }catch(error){
      next(error);
    }


  }
  async categoryProducts(req,res,next){
    const catId=req.params.id;
    try{
      const result=await CategoryService.categoryProducts(catId);
      return ResponseUtil.success(res,result,"category related products",200)

    }catch(error){
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    const { id } = req.params;
    const categoryData = req.body;

    try {

      const result = await CategoryService.updateCategory(id, categoryData);



      return ResponseUtil.success(
        res,
        result,
        "Category updated successfully"
      );

    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const result = await CategoryService.deleteCategory(id);



      return ResponseUtil.success(
        res,
        result,
        "Category deleted successfully"
      );

    } catch (error) {
      next(error);
    }
  }

};

export default new CategoryController();