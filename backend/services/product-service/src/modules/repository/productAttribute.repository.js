import BaseRepository from "./baseRepository.js";
class productAttributesRepository extends BaseRepository{
    constructor(){
        super("ProductAttribute");
    }
    async updateProductAttributes(id,data){
        return await this.updateById(id,data);
    }
    async getAllProductAttributes({offset,limit}){
        return await this.findAndCountAll({},{offset,limit,order:[['created_at','DESC']]});
    }
    async getAttributeByProductId(id){
        return await this.findAndCountAll({product_id:id});
    }
}
export default new productAttributesRepository();