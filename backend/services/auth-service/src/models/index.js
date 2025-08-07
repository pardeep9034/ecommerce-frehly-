// services/auth-service/src/models/index.js
const database = require('../config/database');
const UserModel = require('./User');

let db = {};

async function initializeModels() {
  const sequelize = await database.connect();
  
  // Initialize models
  db.User = UserModel(sequelize);
  db.sequelize = sequelize;
  db.Sequelize = require('sequelize');

  // Sync database (create tables if they don't exist)
  if (process.env.NODE_ENV === 'development') {
    await sequelize.sync({ alter: true });
    console.log('✅ Auth Service: Database tables synchronized');
  }

  return db;
}

module.exports = { db, initializeModels };