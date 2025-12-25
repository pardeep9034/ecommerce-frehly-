// models/index.js
'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Sequelize, DataTypes } from 'sequelize';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);

const env = process.env.NODE_ENV || 'development';

// Load config.json and pick environment
const cfgPath = path.join(__dirname, '/../config/config.json');
const raw = fs.readFileSync(cfgPath, 'utf8');
const allConfig = JSON.parse(raw);
const config = allConfig[env];

const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Dynamically import model files
const files = fs
  .readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  });

for (const file of files) {
  const fullPath = path.join(__dirname, file);
  // import the module dynamically (works with ESM). convert to file URL
  const module = await import(pathToFileURL(fullPath).href);

  // support both ESM default export and CommonJS module.exports
  const modelDef = module.default || module;

  // If the module itself is a function that accepts (sequelize, DataTypes)
  // call it to get the model. Otherwise, if it's already a model, use it directly.
  let model;
  if (typeof modelDef === 'function') {
    model = modelDef(sequelize, DataTypes);
  } else if (modelDef && modelDef.name && modelDef instanceof Sequelize.Model) {
    model = modelDef;
  } else {
    // fallback: try to find a function export inside the module
    const fn = Object.values(module).find((v) => typeof v === 'function');
    if (fn) model = fn(sequelize, DataTypes);
    else throw new Error(`Unable to import model from file: ${file}`);
  }

  db[model.name] = model;
}

// Call associate methods if present
Object.keys(db).forEach((modelName) => {
  if (typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
