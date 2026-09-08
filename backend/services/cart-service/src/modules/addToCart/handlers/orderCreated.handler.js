import addToCartService from "../addToCart.service.js";

export default async  function onCartEmpty(event) {
    await addToCartService.clearCart(event.data.user_id);

}