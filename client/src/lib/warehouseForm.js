// Form state + payload shaping shared by the Add warehouse steps and the detail page.

export const EMPTY_WAREHOUSE_FORM = {
  name: "",
  code: "",
  contact_person: "",
  contact_phone: "",
  address: "",
  city: "",
  pincode: "",
  state: "",
  country: "India",
  zone_id: "",
  latitude: "",
  longitude: "",
  store_open_time: "06:00",
  store_close_time: "22:00",
  pack_by_minutes: "10",
  max_orders_per_slot: "40",
  racks: [],
  auto_assign_riders: false,
};

const str = (value) => (value === null || value === undefined ? "" : String(value));

export const formFromWarehouse = (warehouse) => ({
  ...EMPTY_WAREHOUSE_FORM,
  ...Object.fromEntries(
    Object.keys(EMPTY_WAREHOUSE_FORM)
      .filter((key) => warehouse?.[key] !== null && warehouse?.[key] !== undefined)
      .map((key) => [key, Array.isArray(warehouse[key]) || typeof warehouse[key] === "boolean" ? warehouse[key] : str(warehouse[key])])
  ),
});

const isCoordinate = (value, max) => value !== "" && Number.isFinite(Number(value)) && Math.abs(Number(value)) <= max;

export const validateBasics = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = "Enter a warehouse name";
  if (!form.code.trim()) errors.code = "Enter a short code";
  return errors;
};

export const validateLocation = (form) => {
  const errors = {};
  if (!form.address.trim()) errors.address = "Enter the address";
  if (!form.city.trim()) errors.city = "Enter the city";
  if (form.pincode && !/^\d{6}$/.test(form.pincode.trim())) errors.pincode = "Pincode is 6 digits";
  if (!form.state.trim()) errors.state = "Enter the state";
  if (!form.country.trim()) errors.country = "Enter the country";
  if (!form.zone_id) errors.zone_id = "Pick a delivery zone";
  if (!isCoordinate(form.latitude, 90)) errors.latitude = "Latitude is a number between -90 and 90";
  if (!isCoordinate(form.longitude, 180)) errors.longitude = "Longitude is a number between -180 and 180";
  return errors;
};

export const validateOperations = (form) => {
  const errors = {};
  if (form.store_open_time && form.store_close_time && form.store_open_time >= form.store_close_time) {
    errors.store_hours = "Closing time must be after opening time";
  }
  if (form.pack_by_minutes && !(Number(form.pack_by_minutes) > 0)) errors.pack_by_minutes = "Enter minutes above 0";
  if (form.max_orders_per_slot && !(Number(form.max_orders_per_slot) > 0)) errors.max_orders_per_slot = "Enter a number above 0";
  return errors;
};

// Drop empty values: inventory-service's Joi schema rejects "" for optional strings.
const compact = (object) =>
  Object.fromEntries(Object.entries(object).filter(([, value]) => value !== "" && value !== undefined && value !== null));

// Fields the Warehouse model and its create/update Joi schemas accept today.
// latitude/longitude go as strings because the schemas declare them joi.string().
export const warehousePayload = (form) =>
  compact({
    name: form.name.trim(),
    code: form.code.trim(),
    contact_person: form.contact_person.trim(),
    contact_phone: form.contact_phone.trim(),
    address: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    country: form.country.trim(),
    zone_id: form.zone_id ? Number(form.zone_id) : undefined,
    latitude: form.latitude === "" ? undefined : String(form.latitude).trim(),
    longitude: form.longitude === "" ? undefined : String(form.longitude).trim(),
  });

// Fields for PATCH /warehouses/:id/settings, which doesn't exist yet
// (ADMIN_WAREHOUSES_STAFF_MODULE.md, backend change #5).
export const settingsPayload = (form) =>
  compact({
    pincode: form.pincode.trim(),
    store_open_time: form.store_open_time,
    store_close_time: form.store_close_time,
    pack_by_minutes: form.pack_by_minutes ? Number(form.pack_by_minutes) : undefined,
    max_orders_per_slot: form.max_orders_per_slot ? Number(form.max_orders_per_slot) : undefined,
    racks: form.racks,
    auto_assign_riders: form.auto_assign_riders,
  });

export const formatStoreHours = (open, close) => {
  if (!open || !close) return "Not set";
  const toLabel = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    const suffix = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
  };
  return `${toLabel(open)} – ${toLabel(close)}`;
};
