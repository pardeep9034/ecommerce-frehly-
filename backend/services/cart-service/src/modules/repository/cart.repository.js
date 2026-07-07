import BaseRepository from "./base.repository.js";

class CartRepository extends BaseRepository {
    constructor() {
        super("Cart");
    }

    async getCartByUserId(userId) {
        return await this.findOne({ where: { user_id: userId } });
    }

    async createCart(data) {
        return await this.create(data);
    }
}

export default new CartRepository ();
