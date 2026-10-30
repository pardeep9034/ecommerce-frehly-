// Dev-only live check of the warehouse permission rules through the gateway. Run in auth-service: node warehouseRules.live.mjs
// Uses warehouse 2 (manager: user 246) and puts back what it changes.
import jwt from "jsonwebtoken";
import { env } from "./src/config/env.js";

if (env.NODE_ENV === "production") throw new Error("dev only");
const base = `${env.API_GATEWAY_URL}/warehouses`;
const token = (user_id, role, warehouse_id = null) => jwt.sign({ user_id, role, warehouse_id }, env.JWT_SECRET, { expiresIn: "5m" });
const as = {
  superAdmin: { authorization: `Bearer ${token(1, "SUPER_ADMIN")}` },
  manager: { authorization: `Bearer ${token(246, "ADMIN", 2)}` },
  otherManager: { authorization: `Bearer ${token(245, "ADMIN", 1)}` },
  ops: { authorization: `Bearer ${token(999999, "OPS_STAFF", 2)}` },
  service: { "x-internal-key": env.INTERNAL_API_KEY },
};
const call = async (who, method, path, body) => {
  const res = await fetch(`${base}${path}`, { method, headers: { "content-type": "application/json", ...as[who] }, body: body && JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, message: json.message ?? json.error };
};
const cases = [
  ["manager pauses own store", "manager", "PUT", "/2", { operational_status: "PAUSED", pause_reason: "Live check" }, 200],
  ["manager reopens", "manager", "PUT", "/2", { operational_status: "OPEN", pause_reason: null }, 200],
  ["manager saves a form with the zone unchanged", "manager", "PUT", "/2", { zone_id: 1, pack_by_minutes: 12 }, 200],
  ["manager changes the pincode (location alert)", "manager", "PUT", "/2", { pincode: "160055" }, 200],
  ["manager moves the zone", "manager", "PUT", "/2", { zone_id: 99 }, 403],
  ["manager deactivates", "manager", "PUT", "/2", { is_active: false }, 403],
  ["manager sets SETTING_UP", "manager", "PUT", "/2", { operational_status: "SETTING_UP" }, 403],
  ["other store's manager", "otherManager", "PUT", "/2", { pack_by_minutes: 5 }, 403],
  ["ops staff", "ops", "PUT", "/2", { operational_status: "PAUSED" }, 403],
  ["service copies the contact", "service", "PUT", "/2", { contact_person: "Dinesh Kumar", contact_phone: "9034159056" }, 200],
  ["service changes the status", "service", "PUT", "/2", { operational_status: "PAUSED" }, 403],
  ["manager adds a warehouse", "manager", "POST", "", { code: "LIVECHK", name: "Live check", latitude: 30.7, longitude: 76.7, zone_id: 1 }, 403],
  ["super admin deletes a live store", "superAdmin", "DELETE", "/2", undefined, 409],
  ["manager deletes", "manager", "DELETE", "/2", undefined, 403],
];
let failed = 0;
for (const [label, who, method, path, body, expected] of cases) {
  const { status, message } = await call(who, method, path, body);
  if (status !== expected) failed += 1;
  console.log(`${status === expected ? "ok  " : "FAIL"} ${label}: ${status}${status === expected ? "" : ` (expected ${expected})`} ${message ?? ""}`);
}
const restore = await call("superAdmin", "PUT", "/2", { pack_by_minutes: null, pincode: null, pause_reason: null, operational_status: "OPEN" });
console.log(`restored warehouse 2: ${restore.status}`);
process.exit(failed ? 1 : 0);
