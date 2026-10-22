// Run: node serviceability.check.js   (no database, no running service)
import assert from "node:assert/strict";
import { pickWarehouse, zoneCovers } from "./src/modules/deliveryZone/serviceability.js";

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

console.log("serviceability.check.js: ok");
