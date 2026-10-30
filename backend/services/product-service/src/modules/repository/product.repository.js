import BaseRepository from "./baseRepository.js";


import { Op } from "sequelize";

// What a customer may buy of a product: its ACTIVE variants. A product without one still comes back (variants: [])
// and the shop shows it as Out of stock (changed 2026-10-29, Task 204; was left out).
const ACTIVE_VARIANTS = { association: "variants", where: { status: "ACTIVE" }, required: false };

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
  // Customers' related products: storefront rules (ACTIVE products with their ACTIVE variants).
  async getProductsBycategory(categoryId, limit, offset) {
     return await this.findAndCountAll(
        {
            category_id:categoryId,
            status:"ACTIVE"
        },{
            include: [ACTIVE_VARIANTS],
            limit,
            offset,
            distinct: true,
            order:[["created_at","DESC"]]

        }
     );
}
    // storefront: what customers may see. Every ACTIVE product, each with its ACTIVE variants only (maybe none).
    // Without it (admin lists) every status is returned.
    async getAllProducts(limit = 0, offset = 0, { status, category_id, brand_id, search, storefront } = {}) {
        const where = {};
        if (status) where.status = status;
        if (storefront) where.status = "ACTIVE";
        if (category_id) where.category_id = category_id;
        if (brand_id) where.brand_id = brand_id;
        if (search) where.name = { [Op.iLike]: `%${search}%` };

        return await this.findAndCountAll(where,{
            include: [
                storefront ? ACTIVE_VARIANTS : { association: "variants" },
                { association: "category" },
                { association: "brand", attributes: ["id", "name"] },
                { association: "productType", attributes: ["id", "name"] },
            ],
            limit,
            offset,
            distinct: true, // variants is hasMany: without this the total counts product x variant rows
            order: [["created_at", "DESC"]],
        });
    }
    async findExisting(name,slug,excludeId){
        return await this.findOne({
            [Op.and]:[
                { [Op.or]:[ {name}, {slug} ] },
                excludeId ? { id: { [Op.ne]: excludeId } } : {}
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

        // storefront: only an ACTIVE product (null otherwise), with only its ACTIVE variants (maybe none: Out of stock).
        async getProductById(id, { storefront } = {}) {

            const product = await this.findById(id,{include:[{

            association:"variants",
            attributes:["id","quantity","price","mrp","status"],
            ...(storefront && { where: { status: "ACTIVE" }, required: false }),
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
            return storefront && product?.status !== "ACTIVE" ? null : product;
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

