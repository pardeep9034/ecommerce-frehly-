export const getCartCount = () => {
  try {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    return cart.length; // ✅ number of items
  } catch {
    return 0;
  }
};