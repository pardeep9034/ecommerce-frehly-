import responseUtil from "../../utils/response.js";
import addToCartService from "./addToCart.service.js";
const addToCartController={
    async addToCart(req,res){
        try {
            const result=await addToCartService.add(req.body);
            return responseUtil.success(res,result);
        } catch (error) {
            return responseUtil.error(res,error.message);
        }
    }
}

export default addToCartController;