// Store console reuses the existing OPS_STAFF/ADMIN roles instead of a new
// STORE_STAFF role — OPS_STAFF acts as store staff, ADMIN acts as store
// manager. See STORE_OPERATIONS_MODULE.md.
export const STORE_ROLES = ["OPS_STAFF", "ADMIN"];

export const storeDesignation = (role) => (role === "ADMIN" ? "Store manager" : "Store staff");

// Fallback designation for while GET /store/me doesn't exist yet — reads the
// role straight off the stored JWT instead of waiting on the API.
export const getStoreDesignation = () => {
  const token = localStorage.getItem("token");
  if (!token) return "Store staff";
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return storeDesignation(payload.role);
  } catch {
    return "Store staff";
  }
};
