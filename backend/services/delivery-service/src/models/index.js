import database from "../config/database.js";
import DeliveryModel from "./Delivery.js";

let sequelize;
let db;

async function initializeModels() {
  if (!db) {
    sequelize = await database.connect();

    db = {
      sequelize,
      Sequelize: database.Sequelize,
      Delivery: DeliveryModel(sequelize)
    };

    /* ================= ASSOCIATIONS ================= */
    Object.keys(db).forEach((modelName) => {
      if (db[modelName] && typeof db[modelName].associate === "function") {
        db[modelName].associate(db);
      }
    });

    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      console.log("✅ Delivery Service: Database synced (alter: true)");
    }

    console.log("✅ Delivery Service: Models initialized");
  }

  return db;
}

export { initializeModels, db };
