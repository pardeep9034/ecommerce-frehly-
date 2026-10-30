import { calculateDistance } from "../../utils/helper.js";

// Which warehouse serves a customer at { pincode, lat, lng }. No database: the caller passes zones and warehouses in.
// Sequelize returns DECIMAL columns as strings, hence the Number() calls.

const hasPoint = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng);

// A zone covers the customer when their pincode is in its postal_codes, or their point is within radius_km of its centre.
export function zoneCovers(zone, { pincode, lat, lng }) {
  if (!zone.is_active) return false;
  if (pincode && String(zone.postal_codes ?? "").split(",").map((code) => code.trim()).includes(pincode)) return true;
  if (!hasPoint(lat, lng) || zone.radius_km == null || zone.latitude == null || zone.longitude == null) return false;
  return calculateDistance(Number(zone.latitude), Number(zone.longitude), lat, lng) <= Number(zone.radius_km);
}

// Store hours are local time; every store is in India.
const clock = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

// Active, OPEN (or a pause that has run out: no timer has to reopen it) and inside its hours. No hours set = all day;
// a close time before the open time runs past midnight.
export function takingOrders(w, now = new Date()) {
  if (!w.is_active) return false;
  const pauseOver = w.operational_status === "PAUSED" && w.paused_until && new Date(w.paused_until) <= now;
  if (w.operational_status !== "OPEN" && !pauseOver) return false;
  if (!w.store_open_time || !w.store_close_time) return true;
  const [time, open, close] = [clock.format(now), w.store_open_time.slice(0, 5), w.store_close_time.slice(0, 5)];
  return open <= close ? time >= open && time < close : time >= open || time < close;
}

// Nearest warehouse taking orders in a covering zone. Without a point there is no distance, so the lowest id wins.
// Returns { warehouse, zone } or null when nobody delivers there.
export function pickWarehouse(zones, warehouses, point, now = new Date()) {
  const covering = zones.filter((zone) => zoneCovers(zone, point));
  const zoneIds = new Set(covering.map((zone) => String(zone.id)));
  const open = warehouses.filter((w) => takingOrders(w, now) && zoneIds.has(String(w.zone_id)));
  if (!open.length) return null;

  const rank = (w) => hasPoint(point.lat, point.lng)
    ? calculateDistance(Number(w.latitude), Number(w.longitude), point.lat, point.lng)
    : Number(w.id);
  const warehouse = open.reduce((best, w) => (rank(w) < rank(best) ? w : best));
  return { warehouse, zone: covering.find((zone) => String(zone.id) === String(warehouse.zone_id)) };
}
