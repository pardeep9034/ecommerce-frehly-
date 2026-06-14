import initializeModels from "../../models/index.js";

class CartRepository{
    async add(data){
        
            if(data){
            const db=await initializeModels();
            const result= await db.Cart.create(data);
            return result;


        }
        else{
            return null;
        }
    

       

    }
}
export default CartRepository;




