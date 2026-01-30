import database from "../config/database.js";
import UserModel from "./User.js";
import RefreshTokenModel from "./RefreshToken.js"


let sequelize;
let db;

async function initializeModels() {

    if (!db) {

        sequelize = await database.connect();

        db = {
            sequelize,
            Sequelize: database.Sequelize,
            User: UserModel(sequelize),
            RefreshToken: RefreshTokenModel(sequelize)
        };

        console.log("✅ Auth Service: Models initialized");
    }

    return db;
}

export default initializeModels;
