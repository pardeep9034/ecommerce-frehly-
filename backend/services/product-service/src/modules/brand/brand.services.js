import BrandRepository from "../repository/brand.repository.js";
import SlugMaker from "../../utils/slugMaker.js";
import AppError from "../../utils/AppError.js";

class brandService{
    async createBrand(brandData){
        try{
            const existing=await BrandRepository.findExisting(brandData.name,await SlugMaker(brandData.name));
            if(existing){
                throw new AppError("Brand already exists",400);
            }
            brandData.name= brandData.name.trim();
            brandData.slug = await SlugMaker(brandData.name);
            const brand=await BrandRepository.create(brandData);
            return brand;
        }
        catch(error){
            throw new AppError(error.message,500);
        }
    }
    async getAllBrands({offset,limit}){
        try{
            const{count,rows}=await BrandRepository.getAllBrands({offset,limit});
            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(count / limit);
            return {
                brand:rows,
                pagination: {
          totalItems: count,
          totalPages,
          currentPage,
          limit,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        }
                
            };
        }
        catch(error){
            throw new AppError(error.message,500);
        }
    }
    async updateBrand(id,updateData){
        try{
            const existingBrand = await BrandRepository.findById(id);
            if (!existingBrand) {
              throw new AppError("Brand not found", 404);
            }
            updateData.slug=await SlugMaker(updateData.name?updateData.name:existingBrand.name);
            const brand=await BrandRepository.updateById(id,updateData);
            return brand;
        }catch(error){
            throw new AppError(error.message,500);
        }
    }
    async deleteBrand(id){
        try{
            const existingBrand = await BrandRepository.findById(id);
            if (!existingBrand) {
              throw new AppError("Brand not found", 404);
            }
            const brand=await BrandRepository.deleteById(id);
            return brand;
        }catch(error){
            throw new AppError(error.message,500);
        }
    }
    async getBrandById(id){
        try{
            if(!id){
                throw new AppError("Brand id is required",400);
            }
            const existingBrand=await BrandRepository.findById(id);
            if(!existingBrand){
                throw new AppError("Brand not found",404);
            }
            const brand=await BrandRepository.findById(id);
            return brand;
        }catch(error){
            throw new AppError(error.message,500);
        }
    }

    

}

export default new brandService();