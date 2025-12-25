// services/auth-service/src/models/index.js
// const database = require('../config/database');
import database from '../config/database.js';
// const UserModel = require('./User');
import UserModel from './User.js';

let db = {};

async function initializeModels() {
  const sequelize = await database.connect();
  
  // Initialize models
  db.User = UserModel(sequelize);
  db.sequelize = sequelize;
  // db.Sequelize = require('sequelize');
  db.Sequelize = database.Sequelize;

  // Sync database (create tables if they don't exist)
  if (process.env.NODE_ENV === 'development') {
    await sequelize.sync({ alter: true });
    console.log('✅ Auth Service: Database tables synchronized');
  }

  return db;
}

// module.exports = { db, initializeModels };
export { db, initializeModels };