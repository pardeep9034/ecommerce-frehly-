import { createSlice } from "@reduxjs/toolkit";

// The customer's delivery location and the warehouse that serves it (from GET /delivery-zones/serviceability):
// { serviceable, warehouse_id, zone_id, area, city, pincode, estimated_delivery_time, delivery_fee,
//   minimum_order_amount, lat, lng, address_id, label }. A location nobody serves is kept too, so the banner can say so.
// axiosInstance sends `warehouse_id` as x-warehouse-id.
const KEY = "delivery.location";

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
};

const save = (location) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(location));
  } catch {
    // Storage blocked (private mode): the location still works until the tab closes.
  }
};

const locationSlice = createSlice({
  name: "location",
  initialState: {
    current: load(),
    pickerOpen: false,
  },
  reducers: {
    setLocation: (state, action) => {
      state.current = action.payload;
      save(action.payload);
    },
    openLocationPicker: (state) => {
      state.pickerOpen = true;
    },
    closeLocationPicker: (state) => {
      state.pickerOpen = false;
    },
  },
});

export const { setLocation, openLocationPicker, closeLocationPicker } = locationSlice.actions;
export default locationSlice.reducer;
