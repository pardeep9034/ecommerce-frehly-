import responseUtil from "../../utils/response.js";
import addToCartService from "./addToCart.service.js";
const addToCartController={
    async addToCart(req,res){
        try {
            const user=req.user;
            const result=await addToCartService.add(user,req.body);
            
            if (result.success) {
                return responseUtil.success(res, result.data, result.message, result.statusCode || 200);
            } else {
                return responseUtil.error(res, result.message, result.statusCode || 400);
            }
        } catch (error) {
            return responseUtil.error(res,error.message);
        }
    }
}

export default addToCartController;