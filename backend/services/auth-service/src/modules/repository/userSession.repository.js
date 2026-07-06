import BaseRepository from "./BaseRepository.js";

class UserSessionRepository extends BaseRepository {
    constructor() {
        super('AuthUserSession');
    }



    async findActiveSession(userId, deviceId, options = {}) {
        if (!userId || !deviceId) return null;
        
        return await this.findOne({
            user_id: userId,
            device_id: deviceId,
            status: "ACTIVE"
        }, options);
    }

    async revokeSessionByFamily(familyId, options = {}) {
        if (!familyId) return 0;
        return await this.update({ refresh_family_id: familyId }, { status: "REVOKED", revoked_at: new Date() }, options);
    }

    async revokeSessionByUserId(userId, options = {}) {
        if (!userId) return 0;
        return await this.update({ user_id: userId }, { status: "REVOKED", revoked_at: new Date() }, options);
    }

   

    async findRecentSessions(userId, limit = 5, options = {}) {
        if (!userId) return [];
        const Model = await this.getModel();
        return await Model.findAll({
            where: { user_id: userId, is_revoked: false },
            limit: limit,
            order: [['created_at', 'DESC']],
            ...options
        });
    }

    async deleteExpiredSessions(options = {}) {
        const Model = await this.getModel();
        const now = new Date();
        return await Model.destroy({
            where: {
                expires_at: { [Op.lt]: now },
                is_revoked: false
            },
            ...options
        });
    }
}

export default new UserSessionRepository()