import BaseRepository from "./baseRepository.js";
import { Op } from "sequelize";
class brandRepository extends BaseRepository{
    constructor(){
        super("Brand");
    }
    async findByName(name){
        return await this.findOne({name});
    }
    async findBySlug(slug){
        return await this.findOne({slug});
    }
    async findExisting(name,slug){
        return await this.findOne({
            [Op.or]:[
                {name:name},
                {slug:slug}
            ]
        });
    }
    async getAllBrands({offset=0,limit=10}){
        return await this.findAndCountAll({},{offset,limit,order:[["created_at","DESC"]]});
    }

}
export default new brandRepository();
