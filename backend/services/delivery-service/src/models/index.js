import database from "../config/database.js";
import DeliveryPartnerModel from "./DeliveryPartner.model.js";
import DeliverySlotModel from "./DeliverySlot.model.js";
import DeliveryAssignmentModel from "./DeliveryAssignment.model.js";
import DeliveryAssignmentHistoryModel from "./DeliveryAssignmentHistory.model.js";
import DeliveryStatusHistoryModel from "./DeliveryStatusHistory.model.js";
import DeliveryAttemptModel from "./DeliveryAttempt.model.js";
import DeliveryHandoverModel from "./DeliveryHandover.model.js";
import DeliveryZoneModel from "./DeliveryZone.model.js";
import DeliveryPartnerZoneModel from "./DeliveryPartnerZone.model.js";

let sequelize;
let dbPromise = null;

async function initializeModels() {
  if (!dbPromise) {
    dbPromise = (async () => {
      sequelize = await database.connect();

      const db = {
        sequelize,
        Sequelize: database.Sequelize,
        DeliveryPartner: DeliveryPartnerModel(sequelize),
        DeliverySlot: DeliverySlotModel(sequelize),
        DeliveryAssignment: DeliveryAssignmentModel(sequelize),
        DeliveryAssignmentHistory: DeliveryAssignmentHistoryModel(sequelize),
        DeliveryStatusHistory: DeliveryStatusHistoryModel(sequelize),
        DeliveryAttempt: DeliveryAttemptModel(sequelize),
        DeliveryHandover: DeliveryHandoverModel(sequelize),
        DeliveryZone: DeliveryZoneModel(sequelize),
        DeliveryPartnerZone: DeliveryPartnerZoneModel(sequelize)
      };

      Object.keys(db).forEach((modelName) => {
        if (db[modelName] && typeof db[modelName].associate === "function") {
          db[modelName].associate(db);
        }
      });

      console.log("Delivery Service: Models initialized");
      return db;
    })();
  }

  return dbPromise;
}

export default initializeModels ;

