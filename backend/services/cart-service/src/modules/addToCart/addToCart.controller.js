import responseUtil from "../../utils/response.js";
import addToCartService from "./addToCart.service.js";
class addToCartController{
    async addToCart(req,res,next){
        try {
            const user=req.user;
            const result=await addToCartService.add(user,req.body);
            
        return responseUtil.success(res, result, "Added to cart", 200);

        } catch (error) {
             next(error);
        }
    }

    async getCart(req, res, next) {
        try {
            const cartId = parseInt(req.params.cartId);
            if (isNaN(cartId) || cartId <= 0) {
                return responseUtil.error(res, "Invalid cart ID", 400);
            }
            const result = await addToCartService.getCart(cartId);
            return responseUtil.success(res, result, "Cart retrieved successfully", 200);
        } catch (error) {
            next(error);
        }
    }

    async removeCartItem(req, res, next) {
        try {
            const cartItemId = parseInt(req.params.cartItemId);
            if (isNaN(cartItemId) || cartItemId <= 0) {
                return responseUtil.error(res, "Invalid cart item ID", 400);
            }
            const result = await addToCartService.removeCartItem(cartItemId);
            return responseUtil.success(res, result, "Cart item removed successfully", 200);
        } catch (error) {
            next(error);
        }
    }
    async cartByUserId(req,res,next){
        try{
            const result=await addToCartService.cartByUserId(req.user);
          return  responseUtil.success(res,result,"user cart fetched successfully",200)
        }catch(error){
            next(error);
        }
    }
    async increaseQuantity(req,res,next){
        try{
            const result=await addToCartService.increaseQuantity(req.user,req.params.cartItemId);
            return responseUtil.success(res,result,"item quantity increased ",200)

        }catch(error){
            next(error);
        }
    }
    async decreaseQuantity(req,res,next){
        try{
            const result = await addToCartService.decreaseQuantity(req.user,req.params.cartItemId);
           return responseUtil.success(res,result,"item quantity decrease ",200)

        }catch(error){
            next(error)
        }
    }
}

export default new addToCartController();