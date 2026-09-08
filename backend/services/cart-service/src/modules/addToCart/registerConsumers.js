import queues from "../../messaging/topology/queues.js";
import { consumer } from "../../messaging/index.js";
import { onUserLoggedIn } from "./handlers/userLoggedIn.handler.js";
import  onCartEmpty  from "./handlers/orderCreated.handler.js";

export async function registerCartConsumers() {

    await consumer.subscribe(

        queues.CART_QUEUE.name,

        onUserLoggedIn

    );
    await consumer.subscribe(

        queues.CART_EMPTY_QUEUE.name,
        onCartEmpty
    );

}
