import productAttributeRepository from "../repository/productAttribute.repository.js";
import AppError from "../../utils/AppError.js";
class productAttributeService{
    async getAllProductAttributes({offset,limit}){

        try {
            const {count,rows}=await productAttributeRepository.getAllProductAttributes({offset,limit});
            const totalPages=Math.ceil(count/limit);
            const currentPage=Math.floor(offset/limit)+1;
            return {
                productAttributes:rows,
                pagination:{
                    totalItems:count,
                    totalPages,
                    currentPage,
                    limit,
                    hasNextPage:currentPage<totalPages,
                    hasPrevPage:currentPage>1
                }
            }
        } catch (error) {
            throw new AppError(error.message,500);
        }
    }
    async createProductAttributes(data){
        try{
            const result=await productAttributeRepository.create(data);
            return result;
        }catch(error){
            throw new AppError(error.message,500);
        }
    }
    async updateProductAttributes(id,updateData){
        try{
            const result=await productAttributeRepository.updateProductAttributes(id,updateData);
            return result;
        }catch(error){
            throw new AppError(error.message,500);
        }
    }
    async deleteProductAttributes(id){
        try{
            const result=await productAttributeRepository.deleteById(id);
            return result;
        }catch(error){
            throw new AppError(error.message,500);
        }
    }
    async getProductAttributesById(id){
        try{
            const existing=await productAttributeRepository.findById(id);
            if(!existing){
                throw new AppError("Product attribute not found",404);
            }
            return existing;
        }catch(error){
            throw new AppError(error.message,500);
        }
    }
    async getAttributeByProductId(id){
        try{
            const existing =await productAttributeRepository.getAttributeByProductId(id);
            if(!existing){
                throw new AppError("Product attribute not found",404);
            }
            return existing;
        }catch(error){
            throw new AppError(error.message,500);
        }
    }

}
export default new productAttributeService();