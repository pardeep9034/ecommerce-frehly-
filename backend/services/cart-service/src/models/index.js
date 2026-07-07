import database from "../config/database.js";
import CartModel from "./carts.js";
import CartItemModel from "./cartItems.js";

let sequelize;

let dbPromise=null;

export async function initializeModels() {
  
  if (!dbPromise) {
    dbPromise=(async()=>{
 sequelize = await database.connect();
    const db={
        sequelize,
        Sequelize:database.Sequelize,
        Cart:CartModel(sequelize),
        CartItem:CartItemModel(sequelize)
    }
  

     Object.keys(db).forEach((modelName) => {
            if (db[modelName] && typeof db[modelName].associate === "function") {
                db[modelName].associate(db);
            }
        });

    console.log("✅ Models initialized");
  
  return db;
})()}
return dbPromise;
}

export default initializeModels;
