import CartRepository from "../repository/cart.repository.js";
import CartItemRepository from "../repository/cartItem.repository.js";
import {publisher} from "../../messaging/index.js";
import cartEvents from "../../messaging/events/cart.event.js";
import initializeModels from "../../models/index.js";
import axios from "axios";
import { env } from "../../config/env.js";
import AppError from "../../utils/AppError.js";
import cartRepository from "../repository/cart.repository.js";
import cartItemRepository from "../repository/cartItem.repository.js";
import { number } from "zod";
// import inventoryController from "../../../../inventory-service/src/modules/nventory/inventory.controller.js";



class addToCartService {


    async add(user, data,warehouse_id) {
        // product + inventory validation
        console.log("from add func", data)
        const serviceValidation =
            await this.validateProductAndInventory(data,warehouse_id);
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
        // const variantResponse=await fetch(`${env.API_GATEWAY_URL}/product-variant/variants/${data.variant_id}`)
        // const variant =await variantResponse.json()
        // if(!variant.success){
        //     throw new AppError("variant not found");
        // }
        // const inventoryresponse=await fetch(`${env.API_GATEWAY_URL}/inventory/variant/${data.variant_id}`,{
        //     headers:{
        //          "Content-Type": "application/json",
        //         "x-warehouse-id":warehouse_id
        //     }
        // })
        // const inventory=await variantResponse.json();
        if(data.quantity>serviceValidation.data.inventory.quantity){
            throw new AppError("inventoryu is not available")
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
    async validateProductAndInventory(data,warehouseId) {

        const [productResponse, inventoryResponse] =
            await Promise.all([

                axios.get(

                    `${env.API_GATEWAY_URL}/product-variant/variants/${data.variant_id}`

                ),

                axios.get(

                    `${env.API_GATEWAY_URL}/inventory/variant/${data.variant_id}`,{
                        headers:{
                          "x-warehouse-id":warehouseId
                        }
                    }

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
  const variantInventoryResponse = await fetch(`${env.API_GATEWAY_URL}/inventory/variant/${cartItem.variant_id}`)
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
  const variantInventoryResponse = await fetch(`${env.API_GATEWAY_URL}/inventory/variant/${cartItemData.variant_id}`)
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

async mergeCarts(userId, guestCart,warehouseId) {
    console.log("merge carts",userId, guestCart,warehouseId)
    let userCart= await this.cartByUserId(userId);
    // userCart=await userCart.toJSON();
    const dbCartItems=userCart.items;

console.log("Cart instance:", userCart.constructor.name);

for (const item of dbCartItems) {
    console.log({
        constructor: item.constructor.name,
        hasSave: typeof item.save,
        isSequelizeInstance: !!item.dataValues
    });
}
    //Build a lookup map
    const dbCartMap = new Map();

for (const item of dbCartItems) {
    dbCartMap.set(Number(item.variant_id), item);
}
const itemsToUpdate = [];
const itemsToInsert = [];
const validUpdates = [];
const validInserts = [];
const removedItems = [];

for (const item of guestCart){
    const existing=dbCartMap.get(Number(item.variant_id))
    if(existing){
        console.log("existing.quantity:", existing.quantity, typeof existing.quantity);
console.log("item.quantity:", item.quantity, typeof item.quantity);
           existing.quantity += item.quantity;
        itemsToUpdate.push(existing)
    }
    else{
        itemsToInsert.push(item)
    }
}

const variantIds = [
    ...new Set([
        ...itemsToUpdate.map(i => i.variant_id),
        ...itemsToInsert.map(i => i.variant_id)
    ])
];



const variantsResponse = await fetch(
    `${env.API_GATEWAY_URL}/product-variant/variants/validate`,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            variantIds,
        }),
    }
);

if (!variantsResponse.ok) {
    throw new AppError("Failed to validate variants");
}

const response = await variantsResponse.json();
const variants = response.data;
const variantMap = new Map(
    variants.map(v => [Number(v.id), v])
);


const inventoryResponse=await fetch(`${env.API_GATEWAY_URL}/inventory/validate`,{
                        method:"POST",
                        headers:{
                        "Content-Type":"application/json",
                          "x-warehouse-id":warehouseId
                        },
                        body:JSON.stringify({
                            variantIds
                        })
                    })
const inventory=await inventoryResponse.json();
const inventoryData= inventory.data;
const inventoryMap = new Map(
    inventoryData.map(i => [Number(i.variant_id), i])
);
console.log("variants", variants);
console.log("inventory", inventoryData);
for (const item of itemsToUpdate) {

    const variant = variantMap.get(item.variant_id);

    if (!variant) {
        removedItems.push(item);
        continue;
    }

    const inventory = inventoryMap.get(item.variant_id);

    if (!inventory) {
        removedItems.push(item);
        continue;
    }
const availableStock =
    inventory.current_stock - inventory.reserved_stock;
    if(availableStock<=0){
        removedItems.push(item);
        continue;
    }
    item.quantity = Math.min(
        item.quantity,
       availableStock
    );
    item.cart_id=userCart.id;

    validUpdates.push(item);
}

for (const item of itemsToInsert) {

    const variant = variantMap.get(item.variant_id);

    if (!variant) {
        removedItems.push(item);
        continue;
    }

    const inventory = inventoryMap.get(item.variant_id);

    if (!inventory) {
        removedItems.push(item);
        continue;
    }
    
const availableStock =
    inventory.current_stock - inventory.reserved_stock;
    if(availableStock<=0){
        removedItems.push(item);
        continue;
    }
    item.quantity = Math.min(
        item.quantity,
        availableStock
    );
    item.cart_id=userCart.id;
    validInserts.push(item);
}
console.log("items to update", itemsToUpdate);
console.log("items to insert", itemsToInsert);
console.log("valid updates", validUpdates);
console.log("valid inserts", validInserts);
console.log("removed items", removedItems);

const database= await initializeModels();
const sequelize=database.sequelize;
await sequelize.transaction(async (transaction) => {

    await Promise.all(
    validUpdates.map(item =>
        item.save({ transaction })
    )
);

await CartItemRepository.bulkInsert(validInserts, {
    transaction
});

await CartItemRepository.destroy({
    where: {
        id: removedItems.map(i => i.id)
    },
    transaction
});
});

    if (removedItems.length > 0) {
        //publish event
        await publisher.publish(cartEvents.CART_ITEM_REMOVED, { cartItems: removedItems });
}
}
}
export default new addToCartService();