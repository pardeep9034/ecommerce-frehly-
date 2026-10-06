import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import logger from "../utils/Logger.js";

dotenv.config();

export default {
  async connect() {
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      logging: process.env.NODE_ENV === "development" ? (msg) => logger.debug(msg) : false,
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
    });

    await sequelize.authenticate();
    logger.info("Config Service: Database connected successfully");
    return sequelize;
  },
  Sequelize
};
