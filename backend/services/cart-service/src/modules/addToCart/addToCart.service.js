import CartRepository from "../repository/cart.repository.js";
import CartItemRepository from "../repository/cartItem.repository.js";
import axios from "axios";
import env from "../../config/env.js";
import ResponseUtil from "../../utils/response.js";


const addToCartService={

  // cart.service.js

async add(user, data) {

    // validate request
    const validation = this.validateAddToCart(user, data);

    if (!validation.success) {
        return validation;
    }

    // product + inventory validation
    const serviceValidation =
        await this.validateProductAndInventory(data);

    if (!serviceValidation.success) {
        return serviceValidation;
    }

    // get or create cart
    const cart =
        await this.getOrCreateCart(user.user_id);

    if (!cart.success) {
        return cart;
    }

    // check existing cart item
    const existingCartItem =
        await new CartItemRepository().checkCartItem({

            cartId: cart.data.id,
            productId: data.productId,
            variantId: data.variantId

        });

    // existing cart item
    if (existingCartItem) {

        return await this.handleExistingCartItem(

            existingCartItem,
            serviceValidation.data.inventory,
            data

        );

    }

    // create new cart item
    return await this.createCartItem(
        cart.data,
        serviceValidation.data.product,
        serviceValidation.data.variant,
        serviceValidation.data.inventory,
        data
    );

},


// validate request
validateAddToCart(user, data) {

    if (!user) {

        return {
            success: false,
            statusCode: 401,
            message: "user detail missing"
        };

    }

    if (!data) {

        return { success: false, message: "cart detail missing" };

    }

    if (!data.productId) {

        return { success: false, message: "productId required" };

    }

    // handle both variantId and varientId
    data.varientId = data.varientId || data.variantId;

    if (!data.varientId) {

        return { success: false, message: "variantId required" };

    }

    if (!data.quantity) {

        return { success: false, message: "quantity required" };

    }

    if (data.quantity === 0) {

        return { success: false, message: "quantity cannot be 0" };

    }

    return {
        success: true
    };

},


// validate product + inventory
async validateProductAndInventory(data) {

    const [productResponse, inventoryResponse] =
        await Promise.all([

            axios.get(

                `${env.PRODUCT_SERVICE_URL}/check/${data.productId}/${data.varientId}`

            ).catch((err) => err.response || null),

            axios.get(

                `${env.INVENTORY_SERVICE_URL}/variant/${data.varientId}`

            ).catch((err) => err.response || null)

        ]);

    // product validation
    if (!productResponse || !productResponse.data.success) {

        return {
            success: false,
            message: productResponse?.data?.message || "product service unavailable"
        };

    }

    // inventory validation
    if (!inventoryResponse || !inventoryResponse.data.success) {

        return {
            success: false,
            message: inventoryResponse?.data?.message || "inventory service unavailable"
        };

    }

    return {

        success: true,

        data: {
            product: productResponse.data.data,
            variant: productResponse.data.data.variants[0],
            inventory: inventoryResponse.data.data.stock
        }

    };

}
,

// get or create cart
async getOrCreateCart(userId) {

    let cart =
        await new CartRepository().getCartByUserId(userId);

    if (!cart) {

        cart =
            await new CartRepository().createCart(userId);

    }

    if (!cart) {

        return { success: false, message: "cart not created" };

    }

    return {

        success: true,
        data: cart

    };

}

,
// existing cart item handling
async handleExistingCartItem(
    existingCartItem,
    inventory,
    data
) {

    const finalQuantity =
        existingCartItem.quantity + data.quantity;

    // remove cart item
    if (finalQuantity <= 0) {

        const deleteItem =
            await new CartItemRepository().delete(existingCartItem.id);

        if (!deleteItem) {

            return { success: false, message: "cart item not removed" };

        }

        return {

            success: true,
            statusCode: 200,
            message: "cart item removed"

        };

    }

    // inventory validation
    if (finalQuantity > inventory) {

        return { success: false, message: "inventory not available" };

    }

    // max quantity validation
    if (finalQuantity > 10) {

        return { success: false, message: "max quantity limit exceeded" };

    }

    // update quantity
    const updateQuantity =
        await new CartItemRepository().updateQuantity(

            existingCartItem.id,
            finalQuantity

        );

    if (!updateQuantity) {

        return { success: false, message: "cart item not updated" };

    }

    return {

        success: true,
        statusCode: 200,
        message: "cart item updated successfully"

    };

}
,

// create cart item
async createCartItem(
    cart,
    product,
    variant,
    inventory,
    data
) {

    // inventory validation
    if (data.quantity > inventory) {

        return { success: false, message: "inventory not available" };

    }

    // max quantity validation
    if (data.quantity > 10) {

        return { success: false, message: "max quantity limit exceeded" };

    }

    const itemDetail = {

        cartId: cart.id,

        productId: data.productId,

        variantId: data.varientId,

        quantity: data.quantity,

        priceSnapshot:
            variant.price,

        productNameSnapshot:
            product.name,

        variantNameSnapshot:
            `${variant.value} ${variant.unit}`

    };

    const cartItem =
        await new CartItemRepository().add(itemDetail);

    if (!cartItem) {

        return { success: false, message: "cart item not added" };

    }

    return {

        success: true,
        statusCode: 201,
        message: "cart item added successfully"

    };

}



}
export default addToCartService;