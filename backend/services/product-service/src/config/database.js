// const { Sequelize } = require('sequelize');
import { Sequelize } from 'sequelize';
// require('dotenv').config();
import dotenv from 'dotenv';
import logger from '../utils/Logger.js';
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
          //   require: true,
          //   rejectUnauthorized: false
          // },
         
        }
      });
      

      // Test the connection
      await this.sequelize.authenticate();
      logger.info('✅ Product Service: Database connected successfully');

      return this.sequelize;
    } catch (error) {
    logger.error('❌ Failed to start Product Service:', { message: error.message, stack: error.stack });
    process.exit(1);
  }
}
}
const dbInstance = new Database();
// module.exports = {
//   connect: () => dbInstance.connect()
// };
export default {
  connect: () => dbInstance.connect()
};