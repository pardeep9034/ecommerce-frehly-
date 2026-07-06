import { Sequelize } from "sequelize";
import database from "../config/database.js";

import AuthUserModel from "./User.model.js";
import AuthRefreshTokenModel from "./RefreshToken.model.js";
import AuthOtpModel from "./Otp.model.js";
import AuthAuditLogModel from "./AuditLog.model.js";
import UserSessionModel from "./UserSession.model.js";

let sequelize;
let dbPromise = null;

async function initializeModels() {
    if(!dbPromise){
        dbPromise = (async () => {
    
    
        sequelize = await database.connect();

        const AuthUser = AuthUserModel(sequelize);
        const AuthRefreshToken = AuthRefreshTokenModel(sequelize);
        const AuthOtp = AuthOtpModel(sequelize);
        const AuthAuditLog = AuthAuditLogModel(sequelize);
        const AuthUserSession = UserSessionModel(sequelize);

      const   db = {
            sequelize,
            Sequelize,

            AuthUser,
            AuthRefreshToken,
            AuthOtp,
            AuthUserSession,
            AuthAuditLog
        };

        Object.values(db).forEach((model) => {
            if (
                model &&
                typeof model.associate === "function"
            ) {
                model.associate(db);
            }
        });

        console.log("✅ Auth Service: Models initialized");
         return db;
    }) ();
    }
    return dbPromise;
}

export default initializeModels;