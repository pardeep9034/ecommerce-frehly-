import BaseRepository from "./baseRepository.js";
import { Op } from "sequelize";
class productTypeRepository extends BaseRepository{
    constructor(){
        super("ProductType");
    }
    async findByName(name){
        return await this.findOne({name});
    }
    async findByCode(code){
        return await this.findOne({code});
    }
    async findExisting(name,code){
        return await this.findOne({
            [Op.or]:[
                {name:name},
                {code:code}
            ]
        });
    }
    async getAllProductTypes({offset=0,limit=10}){
        return await this.findAndCountAll({},{offset,limit,order:[["created_at","DESC"]]});
    }

}
export default new productTypeRepository();