import database from "../config/database.js";

let sequelize;
let db;
export async function initializeModels(){
    if(!db){
        sequelize=await database.connect();

        db={};

        
    }
    Object.keys(db).forEach((modelName) => {
  if (db[modelName] && typeof db[modelName].associate === "function") {
    db[modelName].associate(db);
  }
});
    console.log("✅ Models initialized");
    return db;
}

export default initializeModels;
