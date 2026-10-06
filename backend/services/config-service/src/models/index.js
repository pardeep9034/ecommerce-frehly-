import database from "../config/database.js";
import SettingModel from "./Setting.model.js";

let dbPromise = null;

async function initializeModels() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const sequelize = await database.connect();

      const db = {
        sequelize,
        Sequelize: database.Sequelize,
        Setting: SettingModel(sequelize)
      };

      return db;
    })();
  }

  return dbPromise;
}

export default initializeModels;
