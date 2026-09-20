import cartService from "../addToCart.service.js";
import logger from "../../../utils/Logger.js";

export async function onUserLoggedIn(event) {
    logger.debug("Received USER_LOGGED_IN event", { event });
    await cartService.mergeCarts(event.data.user_id, event.data.guest_cart,event.data.warehouse_id);

}