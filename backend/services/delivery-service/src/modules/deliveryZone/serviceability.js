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

// Nearest active, OPEN warehouse in a covering zone. Without a point there is no distance, so the lowest id wins.
// Returns { warehouse, zone } or null when nobody delivers there.
export function pickWarehouse(zones, warehouses, point) {
  const covering = zones.filter((zone) => zoneCovers(zone, point));
  const zoneIds = new Set(covering.map((zone) => String(zone.id)));
  const open = warehouses.filter(
    (w) => w.is_active && w.operational_status === "OPEN" && zoneIds.has(String(w.zone_id)),
  );
  if (!open.length) return null;

  const rank = (w) => hasPoint(point.lat, point.lng)
    ? calculateDistance(Number(w.latitude), Number(w.longitude), point.lat, point.lng)
    : Number(w.id);
  const warehouse = open.reduce((best, w) => (rank(w) < rank(best) ? w : best));
  return { warehouse, zone: covering.find((zone) => String(zone.id) === String(warehouse.zone_id)) };
}
