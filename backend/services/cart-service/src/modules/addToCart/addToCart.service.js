import AddressRepository from "../repository/cart.repository";


const addToCartService={
    async add(data){
        if(data){
            const result=await AddressRepository.create(data);
            return result;

        }
        else{
            return {
              success: false,
              statusCode: 500,
              message: "cart detail missing",
            };

        }

    }
}