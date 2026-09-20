import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import logger from "../utils/Logger.js";
dotenv.config();

class Database {
    constructor() {
        this.sequelize = null;
    }
    
    async connect() {
        try {
            this.sequelize = new Sequelize(process.env.DATABASE_URL, {
                dialect: 'postgres',
                logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
                pool: {
                    max: 10,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                },
                dialectOptions: {
                    // ssl: {
                    //     require: true,
                    //     rejectUnauthorized: false
                    // },
                }
            });
            
            await this.sequelize.authenticate();
            logger.info('✅ Cart Service: Database connected successfully');

            return this.sequelize;
        } catch (error) {
            logger.error('❌ Failed to start Cart Service:', { message: error.message, stack: error.stack });
            process.exit(1);
        }
    }
}

const dbInstance = new Database();

export default {
    connect: () => dbInstance.connect()
};
