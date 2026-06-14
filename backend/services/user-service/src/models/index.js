import database from "../config/database.js";

import AddressModel from "./Address.js";

let sequelize;
let db;

async function initializeModels() {
  if (!db) {
    sequelize = await database.connect();

    db = {
      sequelize,
      Sequelize: database.Sequelize,
    
      Address: AddressModel(sequelize)
    };

    /* ================= ASSOCIATIONS ================= */
    Object.keys(db).forEach((modelName) => {
      if (db[modelName] && typeof db[modelName].associate === "function") {
        db[modelName].associate(db);
      }
    });

    console.log("✅ User Service: Models initialized");
  }

  return db;
}

export { initializeModels, db };
