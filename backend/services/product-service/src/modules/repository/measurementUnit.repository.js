import BaseRepository from "./baseRepository.js";
import { Op } from "sequelize";

class measurementUnitRepository extends BaseRepository{
    constructor(){
        super("MeasurementUnit")
    }
    async findExisting(name,code){
        return this.findOne(
            {
                
                    [Op.or]:[
                        {name},
                        {code}
                    ]
                
            }
        );
    }
    async getAllUnits({offset=0,limit=10,category,search}){
        const where={};
        if(category) where.category=category;
        if(search) where[Op.or]=[
            {name:{[Op.iLike]:`%${search}%`}},
            {code:{[Op.iLike]:`%${search}%`}},
        ];
        return await this.findAndCountAll(where,{offset,limit,order:[["created_at","DESC"]]});
    }
    


}
export default new measurementUnitRepository();