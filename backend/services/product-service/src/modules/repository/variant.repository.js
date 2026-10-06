
import { Op } from "sequelize";
import BaseRepository from "./baseRepository.js";

class VariantRepository extends BaseRepository {
    constructor(){
        super("ProductVariant");
    }
    async searchVariantsByProductName(search) {
        // A variant has no name of its own: it is shown as "<product name> · <qty> <unit>", so match the product's name.
        // ponytail: capped at 200 variants; paginate if a search can legitimately match more than that.
        const like = `%${search.replace(/[\\%_]/g, "\\$&")}%`; // a typed % or _ is literal, not a wildcard
        return await this.findAndCountAll({}, {
            attributes: ["id", "product_id"],
            include: [{ association: "product", attributes: ["id", "name"], where: { name: { [Op.iLike]: like } } }],
            order: [["id", "DESC"]],
            limit: 200,
        });
    }

    async getAllVariants(productId,offset,limit) {
        return await this.findAndCountAll(
          {   product_id:productId},
             {limit: limit,
            offset: offset,
            include:[
                 {
                    association:"measurementUnit",
                    attributes:["id","name","code","category"]
                }
            ],
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
                    attributes:["id","name","code","category"]
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
    async findExistingVariant(sku, barcode) {
           return await this.findOne(
     {
        [Op.or]: [
          { sku },
          { barcode }
 ]
        
      
        });
    }
}

export default new VariantRepository();
