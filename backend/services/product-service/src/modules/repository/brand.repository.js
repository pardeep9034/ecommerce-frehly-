import BaseRepository from "./baseRepository.js";
import { Op, literal } from "sequelize";
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
        // Scalar subquery instead of a JOIN+GROUP BY: no GROUP means findAndCountAll's
        // total-brand count stays a plain number, and the subquery only runs for the
        // page's rows (indexed on products.brand_id), not the whole products table.
        return await this.findAndCountAll({},{
            offset,
            limit,
            order:[["created_at","DESC"]],
            attributes:{
                include:[[
                    literal('(SELECT COUNT(*) FROM products WHERE products.brand_id = "Brands"."id")'),
                    "productCount"
                ]]
            }
        });
    }

}
export default new brandRepository();
