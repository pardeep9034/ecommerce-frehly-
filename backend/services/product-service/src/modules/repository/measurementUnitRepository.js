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
    async getAllUnits({offset=0,limit=10}){
        return await this.findAndCountAll({},{offset,limit,order:[["created_at","DESC"]]});
    }
    


}
export default new measurementUnitRepository();