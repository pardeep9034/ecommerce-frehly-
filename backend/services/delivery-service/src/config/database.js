import { Sequelize } from "sequelize";
import { env } from "./env.js";

class Database {
  constructor() {
    this.sequelize = null;
  }

  async connect() {
    try {
      this.sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: "postgres",
        logging: process.env.NODE_ENV === "development" ? console.log : false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      });

      await this.sequelize.authenticate();
      console.log("✅ Delivery Service: Database connected successfully");
      
      return this.sequelize;
    } catch (error) {
      console.error("❌ Failed to connect to Database (Delivery Service):", error);
      process.exit(1);
    }
  }
}

const dbInstance = new Database();
export default {
  connect: () => dbInstance.connect(),
  Sequelize
};
