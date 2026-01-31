import initializeModels from "../../models/index.js";

class UserRepository {

    async findByPhone(phone) {

        if (phone) {

            const db = await initializeModels();

            return await db.User.findOne({
                where: { phone }
            });

        } else {
            return null;
        }

    }

    async create(payload) {

        if (payload) {

            const db = await initializeModels();

            return await db.User.create(payload);

        } else {
            return null;
        }

    }
   async updateById(id, payload) {

    if (id && payload) {

        const db = await initializeModels();

        const [affectedRows] = await db.User.update(
            payload,
            { where: { id } }
        );

        if (affectedRows > 0) {

            return await db.User.findByPk(id);

        } else {

            return null;
        }

    } else {
        return null;
    }

}





}

export default new UserRepository();
