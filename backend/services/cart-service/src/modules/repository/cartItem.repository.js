import initializeModels from "../../models/index.js";

class CartItemRepository{

    async add(data) {
        if (data) {
            const db = await initializeModels();
            const result = await db.CartItem.create(data);
            return result;

        }
        else {
            return null;
        }
    }
    async checkCartItem(itemDetail){
        const db=await initializeModels();
        const result= await db.CartItem.findOne({where:{cartId:itemDetail.cartId,productId:itemDetail.productId,variantId:itemDetail.variantId}});
        return result;
    }
    async updateQuantity(cartItemId,quantity){
        const db=await initializeModels();
        const result= await db.CartItem.update({quantity:quantity},{where:{id:cartItemId}});
        return result;
    }
    async delete(cartItemId){
        const db=await initializeModels();
        const result= await db.CartItem.destroy({where:{id:cartItemId}});
        return result;
    }
    async getCartItem(cartItemId){
        const db=await initializeModels();
        const result= await db.CartItem.findOne({where:{id:cartItemId}});
        return result;
    }

}

export default CartItemRepository;