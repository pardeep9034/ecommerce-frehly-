// Form state + payload shaping shared by the Add warehouse steps and the detail page.

// Used when a warehouse has no pack_by_minutes saved.
export const DEFAULT_PACK_BY_MINUTES = 10;

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
  pack_by_minutes: String(DEFAULT_PACK_BY_MINUTES),
};

const str = (value) => (value === null || value === undefined ? "" : String(value));

// A saved warehouse with no hours is open all day, so its form shows empty times, not the new-store defaults.
// The API returns TIME as "06:00:00"; the time inputs take "06:00".
export const formFromWarehouse = (warehouse) => ({
  ...EMPTY_WAREHOUSE_FORM,
  ...Object.fromEntries(
    Object.keys(EMPTY_WAREHOUSE_FORM)
      .filter((key) => warehouse?.[key] !== null && warehouse?.[key] !== undefined)
      .map((key) => [key, str(warehouse[key])])
  ),
  store_open_time: str(warehouse?.store_open_time).slice(0, 5),
  store_close_time: str(warehouse?.store_close_time).slice(0, 5),
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
  // A close time before the open time runs past midnight; both empty = open all day.
  if (Boolean(form.store_open_time) !== Boolean(form.store_close_time)) errors.store_hours = "Set both times, or leave both empty";
  else if (form.store_open_time && form.store_open_time === form.store_close_time) errors.store_hours = "Opening and closing times are the same";
  const packBy = Number(form.pack_by_minutes);
  if (form.pack_by_minutes && !(Number.isInteger(packBy) && packBy >= 1 && packBy <= 240)) errors.pack_by_minutes = "Enter whole minutes, 1 to 240";
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

// Store hours and pack-by, for PUT /warehouses/:id only (the create schema doesn't take them). Unlike
// warehousePayload, empty sends null so a cleared field is cleared.
export const settingsPayload = (form) => ({
  store_open_time: form.store_open_time || null,
  store_close_time: form.store_close_time || null,
  pack_by_minutes: form.pack_by_minutes ? Number(form.pack_by_minutes) : null,
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
