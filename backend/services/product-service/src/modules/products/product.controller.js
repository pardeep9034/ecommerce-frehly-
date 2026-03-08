import ProductServices from "./product.services.js";
import response from "../../utils/response.js";
const ProductController = {
  // Controller methods would be defined here

  async getAllProducts(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await ProductServices.getAllProducts({ offset, limit });
    if(result.success) {
      return response.success(res, result.data, result.message);
    } else {
      return response.error(res, result.message);
    }

    // Logic to get all products
  },
  
  async getProductById(req, res) {
    // Logic to get a product by ID
  },
    async createProduct(req, res) {
        const result = await ProductServices.createProduct(req.body);
    if(result.success) {
      return response.success(res, result.data, result.message, 201);
    } else {
      return response.error(res, result.message);
    }
    // Logic to create a new product
  },
  
  async updateProduct(req, res) {
    // Logic to update an existing product
  },
    async deleteProduct(req, res) {
    // Logic to delete a product
    }
};

export default ProductController;
