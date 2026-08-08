import queues from "../../messaging/topology/queues.js";
import { consumer } from "../../messaging/index.js";
import { onUserLoggedIn } from "./handlers/userLoggedIn.handler.js";

export async function registerCartConsumers() {

    await consumer.subscribe(

        queues.CART_QUEUE.name,

        onUserLoggedIn

    );

}