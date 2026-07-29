import CartRepository from "../repository/cart.repository.js";
import CartItemRepository from "../repository/cartItem.repository.js";
import axios from "axios";
import { env } from "../../config/env.js";
import AppError from "../../utils/AppError.js";
import cartRepository from "../repository/cart.repository.js";
import cartItemRepository from "../repository/cartItem.repository.js";
import { number } from "zod";



class addToCartService {


    async add(user, data) {
        // product + inventory validation
        console.log("from add func", data)
        const serviceValidation =
            await this.validateProductAndInventory(data);
        console.log("service validation", serviceValidation)

        if (!serviceValidation.success) {
            throw new AppError(serviceValidation.message, 400)
        }


        const cart = await this.getOrCreateCart(user);
            console.log("user cart",cart)

        if (!cart) {
            throw new AppError("cart not created", 400);
        }

        // check existing cart item
        const existingCartItem =
            await CartItemRepository.checkCartItem({

                cart_id: cart.id,
                variant_id: data.variant_id

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
            cart,
            serviceValidation.data.inventory,
            data
        );

    }

    //create cart
    async createCart(data, user_id) {
        try {
            const cart = await new CartRepository().createCart(cart_id);
            return {
                success: true,
                data: cart
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }








    // validate product + inventory
    async validateProductAndInventory(data) {

        const [productResponse, inventoryResponse] =
            await Promise.all([

                axios.get(

                    `http://localhost:3002/product-variant/variants/${data.variant_id}`

                ),

                axios.get(

                    `http://localhost:3003/inventory/${data.variant_id}`

                )

            ]);
        console.log("productResponse", productResponse.data.data);
        console.log("inventoryResponse", inventoryResponse.data.data);
        // product validation
        if (!productResponse.data.data || !productResponse.data.success) {

            return {
                success: false,
                message: productResponse?.data?.message || "product service unavailable"
            };

        }

        // inventory validation
        if (!inventoryResponse.data.data || !inventoryResponse.data.success) {

            return {
                success: false,
                message: inventoryResponse?.data?.message || "inventory service unavailable"
            };

        }

        return {

            success: true,

            data: {

                variant: productResponse.data.data,
                inventory: inventoryResponse.data.data
            }

        };

    }


    // get or create cart
    async getOrCreateCart(userId) {

        let cart =
            await CartRepository.getCartByUserId(userId);
            console.log("old cart",cart);
            

        if (!cart) {

            cart =
                await CartRepository.createCart({ user_id: userId });

        }



        return (cart.toJSON( ))



    }


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
                await CartItemRepository.delete(existingCartItem.id);

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
        if (finalQuantity > inventory.current_stock) {

            return { success: false, message: "inventory not available" };

        }

        // max quantity validation
        if (finalQuantity > 10) {

            return { success: false, message: "max quantity limit exceeded" };

        }

        // update quantity
        const updateQuantity =
            await CartItemRepository.updateQuantity(

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


    // create cart item
    async createCartItem(
        cart,
        inventory,
        data
    ) {
        console.log("inventory", inventory);
        console.log("data", data);
        console.log("data in cart", cart)
        // inventory validation
        if (data.quantity > inventory.current_stock) {

            return { success: false, message: "inventory not available" };

        }

        // max quantity validation
        if (data.quantity > 10) {

            return { success: false, message: "max quantity limit exceeded" };

        }

        data.cart_id = cart.id;

        const cartItem =
            await CartItemRepository.add(data);

        if (!cartItem) {

            return { success: false, message: "cart item not added" };

        }

        return {

            success: true,
            statusCode: 201,
            message: "cart item added successfully"

        };

    }

    async getCart(cartId) {
        const cart = await CartRepository.findOne({
            where: { id: cartId },
            include: [{ association: "items" }]
        });
        if (!cart) {
            throw new AppError("Cart not found", 404);
        }
        return cart;
    }

    async removeCartItem(cartItemId) {
        const cartItem = await CartItemRepository.getCartItem(cartItemId);
        if (!cartItem) {
            throw new AppError("Cart item not found", 404);
        }
        await CartItemRepository.delete(cartItemId);
        return {
            success: true,
            message: "Cart item removed successfully"
        };
    }
    async cartByUserId(userId){
        if(!userId){
            throw new AppError("user id not found")
        }
        const cart=await cartRepository.getCartByUserId(userId);
        return cart;
    }
   async increaseQuantity(userId, cartItemId) {
  const cart = await cartRepository.getCartByUserId(userId);

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  const cartItem = await cartItemRepository.findOne({
    id: cartItemId,
    cart_id: cart.id
  });

  if (!cartItem) {
    throw new AppError("Cart item not found", 404);
  }
  const variantInventoryResponse = await fetch(`${env.INVENTORY_SERVICE_URL}/inventory/variant/${cartItem.variant_id}`)
  const vaiantInventory=await variantInventoryResponse.json()
  if(!variantInventoryResponse.ok){
    throw new AppError("item not in inventory")
  }
  if(!vaiantInventory.success){
    throw new AppError("item not in inventory")
  }
  const remainingStock=number(vaiantInventory.current_stock)-number(vaiantInventory.reserved_stock)
  if(remainingStock>=1){
 cartItem.quantity += 1;
  await cartItem.save();
  }

 

  return cartItem;
}
async decreaseQuantity(userId,cartItemId){
    const cart = await cartRepository.getCartByUserId(userId);
    console.log();
    

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  let cartItem = await cartItemRepository.findOne({
    id: cartItemId,
    cart_id: cart.id
  });
 
const cartItemData = cartItem.toJSON();
//   console.log(cartItem)

  if (!cartItem) {
    throw new AppError("Cart item not found", 404);
  }
  const variantInventoryResponse = await fetch(`${env.INVENTORY_SERVICE_URL}/inventory/variant/${cartItemData.variant_id}`)
  const vaiantInventory=await variantInventoryResponse.json()
  if(!variantInventoryResponse.ok){
    throw new AppError("item not in inventory")
  }
  if(!vaiantInventory.success){
    throw new AppError("item not in inventory")
  }
  const remainingStock=number(vaiantInventory.current_stock)-number(vaiantInventory.reserved_stock)

 cartItem.quantity -= 1;
 if(cartItem.quantity==0){
    await this.removeCartItem(cartItem.id);
 }else{
  await cartItem.save();
 }
  return cartItem;

}
}
export default new addToCartService();