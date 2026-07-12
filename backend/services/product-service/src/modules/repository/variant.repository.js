
import { Op } from "sequelize";
import BaseRepository from "./baseRepository.js";

class VariantRepository extends BaseRepository {
    constructor(){
        super("ProductVariant");
    }
    async searchVariantsByProductName(search) {
        return await this.findAndCountAll({
                name: { [Op.like]: `%${search}%` },
            
            
            order: [["createdAt", "DESC"]],
        });
    }

    async getAllVariants(productId,offset,limit) {
        return await this.findAndCountAll(
          {   product_id:productId},
             {limit: limit,
            offset: offset,
            order: [["created_at", "DESC"]]}
        );
    }

    async createVariant(variantData) {
        
        return await this.create(variantData);
    }

    async getVariantById(id) {
        return await this.findById(id,{
            include:[
                {
                    association:"product",
                    attributes:["id","name","short_description","status"]
                },
                {
                    association:"measurementUnit",
                    attributes:["id","name","code"]
                }
            ]
            
        });
    }

    async updateVariant(id, variantData) {
        
        return await this.updateById(id,variantData);
    }

    async deleteVariant(id) {
        
        return await this.deleteById(id);
    }
    async findExistingVariant(name,sku){
           return await this.findOne(
     {
        [Op.or]: [
          { name },
          { sku }
        ]
      
        });
    }
}

export default new VariantRepository();
