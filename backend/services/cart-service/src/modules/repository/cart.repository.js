import initializeModels from "../../models/index.js";

class CartRepository {
    async add(data, user) {

        if (data) {
            if (!data.productId || !data.varientId) {
                return {
                    success: false,
                    statusCode: 500,
                    message: "cart detail missing",
                };
            }

            const db = await initializeModels();
            const result = await db.Cart.create(data);
            return result;
        }
        else {
            return null;
        }
    }
    async getCartByUserId(userId) {
        const db = await initializeModels();
        const result = await db.Cart.findOne({ where: { userId: userId } });
        return result;
    }
    async createCart(userId) {
        const db = await initializeModels();
        const result = await db.Cart.create({ userId: userId });
        return result;
    }
    
}
export default CartRepository;




