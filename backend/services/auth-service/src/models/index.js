import database from "../config/database.js";
import UserModel from "./User.js";
import RefreshTokenModel from "./RefreshToken.js";
import OtpModel from "./otp.model.js";
import AuditLogModel from "./AuditLog.js";

let sequelize;
let db;

async function initializeModels() {
    if (!db) {
        sequelize = await database.connect();

        const User = UserModel(sequelize);
        const RefreshToken = RefreshTokenModel(sequelize);
        const OTP = OtpModel(sequelize);
        const AuditLog = AuditLogModel(sequelize);

        // Associations
        User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'tokens' });
        RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

        User.hasMany(OTP, { foreignKey: 'user_id', as: 'otps' });
        OTP.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

        User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
        AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

        db = {
            sequelize,
            Sequelize: database.Sequelize,
            User,
            RefreshToken,
            OTP,
            AuditLog
        };

        console.log("✅ Auth Service: Models initialized");
    }
    return db;
}

export default initializeModels;
