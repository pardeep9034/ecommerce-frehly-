import AppError from "../../utils/AppError.js";
import measurementUnitRepository from "../repository/measurementUnit.repository.js";
const UNIT_CATEGORIES=["WEIGHT","VOLUME","COUNT","PACKAGING"]; // keep in sync with MeasurementUnit.category enum
class measurementUnitService{
 
  async createUnit(data){
    try {
      const existingUnit=await measurementUnitRepository.findExisting(data.name,data.code);
      if(existingUnit){
        throw new AppError("Unit already exists",400);
      }
      const result=await measurementUnitRepository.create(data);
      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message,500);
    }
  }
  async getAllUnits({page=1,limit=10,category,search}){
    const offset=(page-1)*limit;
    try {
      if (category && !UNIT_CATEGORIES.includes(category)) {
        throw new AppError(`category must be one of ${UNIT_CATEGORIES.join(", ")}`,400);
      }
      const {count,rows}=await measurementUnitRepository.getAllUnits({offset,limit,category,search});
      const totalPages = Math.ceil(count / limit);
      const currentPage = Math.floor((offset / limit)) + 1;
      return {
        units :rows,
        pagination: {
          totalItems: count,
          totalPages,
          currentPage,
          limit,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        }

      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message,500);
    }
  }
  async getUnitById(id){
    try {
      const result=await measurementUnitRepository.findById(id);
      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message,500);
    }
  }
  async updateUnit(id,data){
    try {
      const result=await measurementUnitRepository.updateById(id,data);
      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message,500);
    }
  }
  async deleteUnit(id){
    try {
      const result=await measurementUnitRepository.deleteById(id);
      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message,500);
    }
  }
}
export default new measurementUnitService();