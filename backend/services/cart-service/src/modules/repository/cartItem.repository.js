import BaseRepository from "./base.repository.js";

class CartItemRepository extends BaseRepository {
    constructor() {
        super("CartItem");
    }

    async add(data) {
        return await this.create(data);
    }

    async checkCartItem(itemDetail) {
        return await this.findOne({
            where: {
                cart_id: itemDetail.cart_id,
                variant_id: itemDetail.variant_id
            }
        });
    }

    async updateQuantity(cartItemId, quantity) {
        return await this.update({ quantity: quantity }, { where: { id: cartItemId } });
    }

    async delete(cartItemId) {
        return await this.destroy({ where: { id: cartItemId } });
    }

    async getCartItem(cartItemId) {
        return await this.findOne({ where: { id: cartItemId } });
    }
}

export default new CartItemRepository ();