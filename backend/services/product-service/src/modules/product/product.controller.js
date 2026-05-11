import ProductServices from "./product.services.js";
import ResponseUtil from "../../utils/response.js";
const ProductController = {
  // Controller methods would be defined here

  //check product and vrarient exist or not
  async checkProductAndVarientExists(req,res){
    const result = await ProductServices.checkProductAndVarientExists(req.params.productId,req.params.varientId);
    if(result.success) {
      return ResponseUtil.success(res, result.data, result.message);
    } else {
      return ResponseUtil.error(res, result.message);
    }

  },

  async getProductsByType(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const type = req.params.type;
    const result = await ProductServices.getProductsByType(type,limit,offset);
    if(result.success) {
      return ResponseUtil.success(res, result.data, result.message);
    } else {
      return ResponseUtil.error(res, result.message);
    }
  },

  async getAllProducts(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await ProductServices.getAllProducts(limit,offset);
    if(result.success) {
      return ResponseUtil.success(res, result.data, result.message);
    } else {
      return ResponseUtil.error(res, result.message);
    }

    // Logic to get all products
  },
  
  async getProductById(req, res) {
    const result = await ProductServices.getProductById(req.params.id);
    if(result.success) {
      return ResponseUtil.success(res, result.data, result.message);
    } else {
      return ResponseUtil.error(res, result.message);
    }
    // Logic to get a product by ID
  },
    async createProduct(req, res) {
        const result = await ProductServices.createProduct(req.body);
    if(result.success) {
      return ResponseUtil.success(res, result.data, result.message, 201);
    } else {
      return ResponseUtil.error(res, result.message);
    }
    // Logic to create a new product
  },
  
  async updateProduct(req, res) {
    const result = await ProductServices.updateProduct(req.params.id, req.body);
    if(result.success) {
      return ResponseUtil.success(res, result.data, result.message);
    } else {
      return ResponseUtil.error(res, result.message);
    }
    // Logic to update an existing product
  },
    async deleteProduct(req, res) {
    const result = await ProductServices.deleteProduct(req.params.id);
    if(result.success) {
      return ResponseUtil.success(res, result.data, result.message);
    } else {
      return ResponseUtil.error(res, result.message);
    }
    // Logic to delete a product
    }
};

export default ProductController;
