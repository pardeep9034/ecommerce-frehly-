import database from "../config/database.js";
import DeliveryPartnerModel from "./DeliveryPartner.js";
import DeliverySlotModel from "./DeliverySlot.js";
import DeliveryAssignmentModel from "./DeliveryAssignment.js";
import DeliveryAssignmentHistoryModel from "./DeliveryAssignmentHistory.js";
import DeliveryStatusHistoryModel from "./DeliveryStatusHistory.js";
import DeliveryAttemptModel from "./DeliveryAttempt.js";
import DeliveryHandoverModel from "./DeliveryHandover.js";
import DeliveryZoneModel from "./DeliveryZone.js";
import DeliveryPartnerZoneModel from "./DeliveryPartnerZone.js";

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

