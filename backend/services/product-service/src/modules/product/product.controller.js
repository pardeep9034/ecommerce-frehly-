import ProductServices from "./product.services.js";
import ResponseUtil from "../../utils/response.js";
class ProductController  {
 
  async checkProductAndVarientExists(req,res){
    const result = await ProductServices.checkProductAndVarientExists(req.params.productId,req.params.varientId);
    if(result.success) {
      return ResponseUtil.success(res, result.data, result.message);
    } else {
      return ResponseUtil.error(res, result.message);
    }

  }

  async getProductsBycategory(req, res,next) {
    try{
    const categoryId=req.query.category;
    const page=req.query.page;
    const limit=req.query.limit;
    const offset=(page-1)*limit;
    const result = await ProductServices.getProductsBycategory(categoryId,limit,offset);
    return ResponseUtil.success(res, result, "Product fetched successfully", 200);
    }
    catch(error){
      next(error)
    }
  }

  async getAllProducts(req, res,next) {
    try{
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await ProductServices.getAllProducts(limit,offset);
   return ResponseUtil.success(res, result, "Product fetched successfully", 200);
  }catch(error){
    next(error)
  }

    // Logic to get all products
  }
  
  async getProductById(req, res,next) {
    try{
    const result = await ProductServices.getProductById(req.params.id);
    return ResponseUtil.success(res, result, "Product fetched successfully", 200);
    }
    catch(error){
      next(error)
    }
   
    // Logic to get a product by ID
  }
    async createProduct(req, res,next) {
      try{
        const result = await ProductServices.createProduct(req.body);
  
      return ResponseUtil.success(res, result, "Product created successfully", 201);
    }
    catch(error){
next(error)
    }
    
  }
  
  async updateProduct(req, res,next) {
    try{
      const result = await ProductServices.updateProduct(req.params.id, req.body);
      return ResponseUtil.success(res, result, "Product updated successfully", 200);
    } catch(error){
      next(error)
    }
  }
    async deleteProduct(req, res,next) {
    const result = await ProductServices.deleteProduct(req.params.id);
    if(result.success) {
      return ResponseUtil.success(res, result.data, result.message);
    } else {
      return ResponseUtil.error(res, result.message);
    }
    // Logic to delete a product
    }
};

export default new ProductController();
