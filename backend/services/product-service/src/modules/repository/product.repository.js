import BaseRepository from "./baseRepository.js";


import { Op } from "sequelize";

class ProductRepository extends BaseRepository{
    constructor(){
        super("Product");
    }

    
    // async checkProductAndVarientExists(productId,varientId){
        
    //     return await this.findOne({
           
    //             id:productId,
                
    //         },
    //         include:[
    //             {
    //                 model:db.ProductVariant,
    //                 as:"variants",
    //                 where:{
    //                     id:varientId
    //                 },
    //                 attributes: ["id", "unitType", "value", "unit", "price", "mrp", "status"]
    //             }
    //         ]
    //     );
    // }
  async getProductsBycategory(categoryId, limit, offset) {
     return await this.findAndCountAll(
        {
            category_id:categoryId,
            status:"DRAFT"
        },{
            limit,
            offset,
            order:[["created_at","DESC"]]
            
        }
     );
}
    async getAllProducts(limit = 0, offset = 0) {
    
        return await this.findAndCountAll({},{
           include: [
    { association: "variants" },
    { association: "category" }
],
            limit,
            offset,
            order: [["created_at", "DESC"]],
          
        });
    }
    async findExisting(name,slug){
        return await this.findOne({
            [Op.or]:[
                {name},
                {slug}
            ]
        });
    }
    async searchProductsByName(search) {
        return await this.findAll(
            {
                name: { [Op.iLike]: `%${search}%` },
            },
            {
                include: [
                    {
                        association: "variants",
                        attributes: ["id"]
                    }
                ],
                order: [["created_at", "DESC"]],
            }
        );
    }
    async getProductSelection(search, limit, offset) {
        const whereClause = search ? { name: { [Op.iLike]: `%${search}%` } } : {};
        return await this.findAndCountAll(whereClause, {
            limit,
            offset,
            attributes: ["id", "name" ],
            order: [["created_at", "DESC"]],
        });
    }

        async getProductById(id) {
        
            return await this.findById(id,{include:[{
            
            association:"variants",
            attributes:["id","quantity","price","mrp","status"]
            },
        {
            association:"category",
            attributes:["id","name","parent_id","image_url","sort_order"]
        },
    {
        association:"brand",
        attributes:["id","name"]
    }
    ,{
        association:"productType",
        attributes:["id","name","is_active"]
    },{
        association:"productAttributes",
        attributes:["id","attribute_name","attribute_value","data_type","sort_order"]
    }]
            }); 
        };
        
        async createProduct(productData) {
        return await this.create(productData);
    }

    async updateProduct(id, productData) {
       
        return await this.updateById(id, productData);
    }

    async deleteProduct(id) {
        return await this.deleteById(id);
    }
}

export default new ProductRepository();

