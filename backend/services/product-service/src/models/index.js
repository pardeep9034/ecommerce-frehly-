import database from "../config/database.js";

import CategoryModel from "./Category.js";
import ProductModel from "./product.js";
import ProductImageModel from "./productImages.js";
import BrandModel from "./brands.js";
import MeasurementUnitModel from "./measurementUnit.js";
import ProductTypeModel from "./productType.js";
import ProductAttributeModel from "./productAttributes.js";
import ProductVariantModel from "./productVariant.js";
import PromotionModel from "./Promotion.js";
import PromotionItemModel from "./PromotionItem.js";
import ProductStatsModel from "./ProductStats.js";

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

        console.log("✅ Product Service: Models initialized");
         return db;
  })()
}
return dbPromise
}


export default  initializeModels;