import AppError from "../../utils/AppError.js";
import productTypeRepository from "../repository/productType.repository.js";
class productTypeService{
    async createProductType(data){
        try{
            const existingProductType=await productTypeRepository.findExisting(data.name,data.code);
            if(existingProductType){
                throw new AppError("ProductType already exists",400);
            }
            const productType=await productTypeRepository.create(data);
            return productType;

        }catch(error){
          throw new AppError(error.message,500);  
        }
    }
    async getAllProductTypes({page=1,limit=10}){
       const offset=(page-1)*limit;
        try{
            const {count ,rows}=await productTypeRepository.getAllProductTypes({offset,limit});
            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(count / limit);
            return {
                productTypes:rows,
                 pagination: {
          totalItems: count,
          totalPages,
          currentPage,
          limit,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        }

            };
        }catch(error){
            throw new AppError(error.message,500);  
        }
    }
    async getProductTypeById(id){
        try{
            if(!id){
                throw new AppError("id is required",400);
            }
            const productType=await productTypeRepository.findById(id);
            if(!productType){
                throw new AppError("ProductType not found",404);
            }
            return productType;

        }catch(error){
            throw new AppError(error.message,500);  
        }
    }
    async updateProductType(id,data){
        try{
            if(!id){
                throw new AppError("id is required",400);
            }
            const productType=await productTypeRepository.findById(id);
            if(!productType){
                throw new AppError("ProductType not found",404);
            }
            const updatedProductType=await productTypeRepository.updateById(id,data);
            return updatedProductType;

        }catch(error){
             throw new AppError(error.message,500);  
        }
    }
    async deleteProductType(id){
        try{
            if(!id){
                throw new AppError("id is required",400);
            }
            const productType=await productTypeRepository.findById(id);
            if(!productType){
                throw new AppError("ProductType not found",404);
            }
            const deletedProductType=await productTypeRepository.deleteById(id);
            return deletedProductType;

        }catch(error){
             throw new AppError(error.message,500);  
        }
    }
}
export default new productTypeService();