import { createSlice } from "@reduxjs/toolkit";

const getInitialCart = () => {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    return [];
  }
};

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: getInitialCart()
  },

  reducers: {
    addToCart: (state, action) => {
      const newItem = action.payload;

      const existing = state.items.find(
        (item) =>
          item.product_id === newItem.product_id &&
          item.variant_id === newItem.variant_id
      );

      if (existing) {
        existing.quantity += newItem.quantity || 1;
      } else {
        state.items.push({
          ...newItem,
          quantity: newItem.quantity || 1
        });
      }

      // 🔥 sync to localStorage
      localStorage.setItem("cart", JSON.stringify(state.items));
    },

    updateQuantity: (state, action) => {
      const { product_id, variant_id, quantity } = action.payload;
      const item = state.items.find(
        (i) => i.product_id === product_id && i.variant_id === variant_id
      );
      if (item) {
        item.quantity = Math.max(1, quantity);
        localStorage.setItem("cart", JSON.stringify(state.items));
      }
    },

    removeFromCart: (state, action) => {
      const { product_id, variant_id } = action.payload;
      state.items = state.items.filter(
        (item) => !(item.product_id === product_id && item.variant_id === variant_id)
      );

      localStorage.setItem("cart", JSON.stringify(state.items));
    },
    setCart: (state, action) => {
  state.items = action.payload;
  localStorage.setItem(
    "cart",
    JSON.stringify(state.items)
  );
},

    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem("cart");
    }
  }
});

export const { addToCart, removeFromCart, updateQuantity, clearCart,setCart } = cartSlice.actions;
export default cartSlice.reducer;