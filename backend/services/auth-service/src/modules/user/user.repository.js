import { db } from "../../models/index.js";
const { User } = db;
class UserRepository {
    async findByPhone(phone) {
        if (phone) {
            return await User.findOne({ where: { phone } });
        } else {
            return null;
        }
    }

    async create(payload) {
        if (payload) {
            return await User.create(payload);
        } else {
            return null;
        }
    }
}

export default new UserRepository();
