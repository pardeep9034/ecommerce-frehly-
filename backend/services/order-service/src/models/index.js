import database from "../config/database.js";

import OrderModel from "./Order.model.js";
import OrderItemModel from "./OrderItem.model.js";
import OrderAddressModel from "./OrderAddress.model.js";
import OrderStatusHistoryModel from "./OrderStatusHistory.model.js";
import PaymentModel from "./Payment.model.js";
import logger from "../utils/Logger.js";

let sequelize;
let dbPromise = null;

async function initializeModels() {
  if (!dbPromise) {
    dbPromise = (async () => {
      sequelize = await database.connect();

      const db = {
        sequelize,
        Sequelize: database.Sequelize,
        Order: OrderModel(sequelize),
        OrderItem: OrderItemModel(sequelize),
        OrderAddress: OrderAddressModel(sequelize),
        OrderStatusHistory: OrderStatusHistoryModel(sequelize),
        Payment: PaymentModel(sequelize)
      };

      Object.keys(db).forEach((modelName) => {
        if (db[modelName] && typeof db[modelName].associate === "function") {
          db[modelName].associate(db);
        }
      });

      logger.info("Order Service: Models initialized");
      return db;
    })();
  }

  return dbPromise;
}

export default initializeModels;
