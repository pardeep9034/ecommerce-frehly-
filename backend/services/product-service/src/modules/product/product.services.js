import slugMaker from "../../utils/slugMaker.js";
import ProductRepository from "../repository/product.repository.js";
import { generateSku } from "../../utils/helper.js";
import AppError from "../../utils/AppError.js";
class ProductServices {


    // async checkProductAndVarientExists(productId,varientId){
    //     if(!productId || !varientId){
    //         return {
    //             success: false,
    //             statusCode: 500,
    //             message: "product or varient id missing",
    //           };
    //     }
    //     const product = await new ProductRepository().checkProductAndVarientExists(productId,varientId);
    //     if(!product){
    //         return {
    //             success: false,
    //             message: "product or varient not exist",
    //           };
    //     }
    //     return {
    //         success: true,
    //         data: product,
    //     };
    // }
    async getProductsBycategory(categoryId,limit,offset) {
        const { count, rows } = await ProductRepository.getProductsBycategory(categoryId,limit,offset);
        const currentPage = Math.floor(offset / limit) + 1;
        const totalPages = Math.ceil(count / limit);
        return {
          
                products: rows,
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
    async getAllProducts(limit,offset) {
        try{
      const { count, rows } = await  ProductRepository.getAllProducts(limit,offset);
      const currentPage = Math.floor(offset / limit) + 1;
      const totalPages = Math.ceil(count / limit);
     return {
    
        products: rows,
        pagination: {
          totalItems: count,
          totalPages,
          currentPage,
          limit,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        },
      
    };
    }catch(error){
        throw new AppError(error.message,500)
    }
    }
    
    async getProductById(id) {
        try{
            const product = await  ProductRepository.getProductById(id);
            return product;
        }catch(error){
            throw new AppError(error.message,500);
        }
    }
    async createProduct(productData) {
    try{
        const slug = await slugMaker(productData.name);
        const existing=await ProductRepository.findExisting(productData.name,slug);
        if(existing){
            throw new AppError("Product already exists", 409);
        }
        productData.slug=slug
        productData.sku=generateSku()
       
        const product = await ProductRepository.createProduct(productData);
        return product;
    }catch(error){
        throw new AppError(error.message,500)
    }
    }
    
    async updateProduct(id, productData) {
        try{
            if(!id){
                throw new AppError("Product id is required", 400);
            }
            const productExists = await  ProductRepository.getProductById(id);
            if(!productExists){
                throw new AppError("Product not found", 404);
            }
            const slug = await slugMaker(productData.name);
            const existing=await ProductRepository.findExisting(productData.name,slug);
            if(existing){
                throw new AppError("Product already exists with same name", 409);
            }
            productData.slug=slug
           
            const product = await ProductRepository.updateProduct(id,productData);
            return product;
        }catch(error){
            throw new AppError(error.message,500)
        }
    }
    async deleteProduct(id) {
       try{
        if(!id){
            throw new AppError("Product id is required", 400);
        }
        const productExists = await  ProductRepository.getProductById(id);
        if(!productExists){
            throw new AppError("Product not found", 404);
        }
        const product = await ProductRepository.deleteProduct(id);
        return product;
       }catch(error){
           throw new AppError(error.message,500)
       }
    }
    

};

export default new ProductServices()  ;