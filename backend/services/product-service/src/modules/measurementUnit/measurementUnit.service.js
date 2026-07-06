import AppError from "../../utils/AppError.js";
import measurementUnitRepository from "../repository/measurementUnitRepository.js";
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
      throw new AppError(error.message,500);
    }
  }
  async getAllUnits({page=1,limit=10}){
    const offset=(page-1)*limit;
    try {
      const {count,rows}=await measurementUnitRepository.getAllUnits({offset,limit});
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
      throw new AppError(error.message,500);
    }
  }
  async getUnitById(id){
    try {
      const result=await measurementUnitRepository.findById(id);
      return result;
    } catch (error) {
      throw new AppError(error.message,500);
    }
  }
  async updateUnit(id,data){
    try {
      const result=await measurementUnitRepository.updateById(id,data);
      return result;
    } catch (error) {
      throw new AppError(error.message,500);
    }
  }
  async deleteUnit(id){
    try {
      const result=await measurementUnitRepository.deleteById(id);
      return result;
    } catch (error) {
      throw new AppError(error.message,500);
    }
  }
}
export default new measurementUnitService();