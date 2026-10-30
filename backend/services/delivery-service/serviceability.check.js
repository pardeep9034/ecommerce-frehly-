// Run: node serviceability.check.js   (no database, no running service)
import assert from "node:assert/strict";
import { pickWarehouse, takingOrders, zoneCovers } from "./src/modules/deliveryZone/serviceability.js";

// Mohali zone: centre 30.7046,76.7178, 10 km, three pincodes. Values as strings, like Sequelize DECIMALs.
const mohali = { id: 1, is_active: true, postal_codes: "160055, 160062,140308", latitude: "30.70464900", longitude: "76.71787300", radius_km: "10.00" };
const closed = { id: 2, is_active: false, postal_codes: "110001", latitude: "28.6", longitude: "77.2", radius_km: "50" };
const zones = [mohali, closed];

const near = { id: 5, zone_id: 1, is_active: true, operational_status: "OPEN", latitude: "30.70", longitude: "76.71" };
const far = { id: 3, zone_id: 1, is_active: true, operational_status: "OPEN", latitude: "30.75", longitude: "76.78" };
const paused = { id: 1, zone_id: 1, is_active: true, operational_status: "PAUSED", latitude: "30.7046", longitude: "76.7178" };
const inactive = { id: 2, zone_id: 1, is_active: false, operational_status: "OPEN", latitude: "30.7046", longitude: "76.7178" };
const delhi = { id: 9, zone_id: 2, is_active: true, operational_status: "OPEN", latitude: "28.6", longitude: "77.2" };
const warehouses = [far, paused, inactive, near, delhi];

// zone coverage
assert.ok(zoneCovers(mohali, { pincode: "160062" }), "pincode in the list (spaces trimmed)");
assert.ok(!zoneCovers(mohali, { pincode: "16006" }), "a prefix is not a match");
assert.ok(zoneCovers(mohali, { lat: 30.75, lng: 76.75 }), "about 6 km from the centre");
assert.ok(!zoneCovers(mohali, { lat: 30.9, lng: 76.9 }), "about 28 km away");
assert.ok(!zoneCovers(closed, { pincode: "110001" }), "inactive zone covers nothing");
assert.ok(!zoneCovers({ ...mohali, radius_km: null }, { lat: 30.7046, lng: 76.7178 }), "no radius: pincode only");

// pincode only: lowest id among active OPEN warehouses (paused 1 and inactive 2 skipped)
assert.equal(pickWarehouse(zones, warehouses, { pincode: "160055" }).warehouse.id, 3);
// a point: nearest wins
const byPoint = pickWarehouse(zones, warehouses, { lat: 30.701, lng: 76.711 });
assert.equal(byPoint.warehouse.id, 5);
assert.equal(byPoint.zone.id, 1);
// pincode outside every active zone, and a zone with only closed warehouses
assert.equal(pickWarehouse(zones, warehouses, { pincode: "110001" }), null);
assert.equal(pickWarehouse(zones, [paused, inactive], { pincode: "160055" }), null);

// store hours (India time) and pauses that run out
const at = (ist) => new Date(`2026-10-26T${ist}:00+05:30`);
const day = { ...near, store_open_time: "06:00:00", store_close_time: "22:00:00" };
const night = { ...near, store_open_time: "22:00", store_close_time: "06:00" };
assert.ok(takingOrders(day, at("06:00")) && takingOrders(day, at("21:59")), "inside its hours");
assert.ok(!takingOrders(day, at("22:00")) && !takingOrders(day, at("05:59")), "closed outside them");
assert.ok(takingOrders(night, at("23:30")) && takingOrders(night, at("02:00")) && !takingOrders(night, at("12:00")), "past midnight");
assert.ok(takingOrders(near, at("03:00")), "no hours set: all day");
assert.ok(!takingOrders({ ...paused, paused_until: "2026-10-26T10:00:00+05:30" }, at("09:59")), "paused");
assert.ok(takingOrders({ ...paused, paused_until: "2026-10-26T10:00:00+05:30" }, at("10:00")), "the pause ran out");
assert.ok(!takingOrders({ ...paused, paused_until: null }, at("10:00")), "paused until reopened");
assert.ok(!takingOrders({ ...near, operational_status: "MAINTENANCE" }), "maintenance");
assert.equal(pickWarehouse(zones, [day, far], { pincode: "160055" }, at("23:00")).warehouse.id, 3, "a closed store is skipped");

console.log("serviceability.check.js: ok");
