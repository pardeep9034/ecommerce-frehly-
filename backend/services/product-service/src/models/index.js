import database from "../config/database.js";

import CategoryModel from "./Category.js";
import ProductModel from "./Product.js";
import ProductVariantModel from "./ProductVariant.js";

let sequelize;
let db;

async function initializeModels() {

    if (!db) {

        sequelize = await database.connect();

        db = {
            sequelize,
            Sequelize: database.Sequelize,

            Category: CategoryModel(sequelize),
            Product: ProductModel(sequelize),
            ProductVariant: ProductVariantModel(sequelize)
        };

        /* ================= ASSOCIATIONS ================= */

       Object.keys(db).forEach((modelName) => {
    if (db[modelName] && typeof db[modelName].associate === "function") {
        db[modelName].associate(db);
    }
});

        console.log("✅ Product Service: Models initialized");
    }

    return db;
}

export default initializeModels;