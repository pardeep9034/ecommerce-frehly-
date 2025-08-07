const { Sequelize } = require('sequelize');
require('dotenv').config();

class Database {
  constructor() {
    this.sequelize = null;
  }

  async connect() {
    try {
      this.sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        dialectOptions: {
          // For Railway or SSL connections
          ssl: process.env.NODE_ENV === 'production' ? {
            require: true,
            rejectUnauthorized: false
          } : false
        }
      });

      // Test the connection
      await this.sequelize.authenticate();
      console.log('✅ Auth Service: Database connected successfully');
      
      return this.sequelize;
    } catch (error) {
    console.error('❌ Failed to start Auth Service:', error);
    process.exit(1);
  }
}
}
const dbInstance = new Database();
module.exports = {
  connect: () => dbInstance.connect()
};