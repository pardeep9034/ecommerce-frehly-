import database from "../config/database.js";
import InventoryModel from "./Inventory.js";

let sequelize;
let db;

async function initializeModels() {
    if (!db) {
        sequelize = await database.connect();

        db = {
            sequelize,
            Sequelize: database.Sequelize,
            Inventory: InventoryModel(sequelize)
        };

        /* ================= ASSOCIATIONS ================= */
        Object.keys(db).forEach((modelName) => {
            if (db[modelName] && typeof db[modelName].associate === "function") {
                db[modelName].associate(db);
            }
        });

        // Sync models to DB (in dev mode) to ensure table exists
        if (process.env.NODE_ENV === "development") {
            await sequelize.sync({ alter: true });
        }

        console.log("✅ Inventory Service: Models initialized");
    }

    return db;
}

export { initializeModels, db };
