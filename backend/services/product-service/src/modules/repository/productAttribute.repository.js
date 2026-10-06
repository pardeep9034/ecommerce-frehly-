import { Op } from "sequelize";
import BaseRepository from "./baseRepository.js";
class productAttributesRepository extends BaseRepository{
    constructor(){
        super("ProductAttribute");
    }
    async updateProductAttributes(id,data){
        return await this.updateById(id,data);
    }
    async getAllProductAttributes({offset,limit,product_id,search,is_filterable}){
        const where={};
        if(product_id) where.product_id=product_id;
        if(is_filterable) where.is_filterable=true;
        if(search) where[Op.or]=[
            {attribute_name:{[Op.iLike]:`%${search}%`}},
            {attribute_value:{[Op.iLike]:`%${search}%`}},
        ];
        return await this.findAndCountAll(where,{offset,limit,order:[['created_at','DESC']]});
    }
    async getAttributeByProductId(id){
        return await this.findAndCountAll({product_id:id});
    }
}
export default new productAttributesRepository();