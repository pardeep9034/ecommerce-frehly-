import database from "../config/database.js";

import CategoryModel from "./Category.model.js";
import ProductModel from "./Product.model.js";
import ProductImageModel from "./ProductImage.model.js";
import BrandModel from "./Brand.model.js";
import MeasurementUnitModel from "./MeasurementUnit.model.js";
import ProductTypeModel from "./ProductType.model.js";
import ProductAttributeModel from "./ProductAttribute.model.js";
import ProductVariantModel from "./ProductVariant.model.js";
import PromotionModel from "./Promotion.model.js";
import PromotionItemModel from "./PromotionItem.model.js";
import ProductStatsModel from "./ProductStats.model.js";
import logger from "../utils/Logger.js";

let sequelize;
let dbPromise = null;
async function initializeModels() {
if(!dbPromise){
  dbPromise = (async () => {
  

        sequelize = await database.connect();

        const  db = {
            sequelize,
            Sequelize: database.Sequelize,

            Category: CategoryModel(sequelize),
            Product: ProductModel(sequelize),
            ProductVariant: ProductVariantModel(sequelize),
            Brand:BrandModel(sequelize),
            MeasurementUnit:MeasurementUnitModel(sequelize),
            ProductType:ProductTypeModel(sequelize),
            ProductAttribute:ProductAttributeModel(sequelize),
            ProductImage:ProductImageModel(sequelize),
            
            Promotion: PromotionModel(sequelize),
            PromotionItem: PromotionItemModel(sequelize),
            ProductStats: ProductStatsModel(sequelize)
        };

        /* ================= ASSOCIATIONS ================= */

       Object.keys(db).forEach((modelName) => {
            if (db[modelName] && typeof db[modelName].associate === "function") {
                db[modelName].associate(db);
            }
        });

        logger.info("✅ Product Service: Models initialized");
         return db;
  })()
}
return dbPromise
}


export default  initializeModels;