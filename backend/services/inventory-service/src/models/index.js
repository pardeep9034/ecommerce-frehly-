import database from "../config/database.js";
import InventoryModel from "./Inventory.model.js";
import StockMovementModel from "./StockMovement.model.js";
import StockReservationModel from "./StockReservation.model.js";
import Warehouse from "./Warehouse.model.js";

let sequelize;
let dbPromise = null;

async function initializeModels() {
    if (!dbPromise) {
        dbPromise = (async () => {
        sequelize = await database.connect();

      const  db = {
            sequelize,
            Sequelize: database.Sequelize,
            Inventory: InventoryModel(sequelize),
            StockMovement: StockMovementModel(sequelize),
            StockReservation: StockReservationModel(sequelize),
            Warehouse: Warehouse(sequelize)

        };

        /* ================= ASSOCIATIONS ================= */
        Object.keys(db).forEach((modelName) => {
            if (db[modelName] && typeof db[modelName].associate === "function") {
                db[modelName].associate(db);
            }
        });

        console.log("✅ Inventory Service: Models initialized");
        return db;
    })()
    }

    return dbPromise;
}

export default initializeModels;
