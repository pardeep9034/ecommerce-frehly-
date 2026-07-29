import { includes } from "zod";
import BaseRepository from "./base.repository.js";
import { Association } from "sequelize";

class CartRepository extends BaseRepository {
    constructor() {
        super("Cart");
    }

    async getCartByUserId(userId) {
        return await this.findOne({ where: { user_id: userId } ,
        include:[
            
            {association:"items",
                attributes: {
        exclude: ["created_at", "updated_at"]
      }
            }
        ]});
    }

    async createCart(data) {
        return await this.create(data);
    }
}

export default new CartRepository ();
