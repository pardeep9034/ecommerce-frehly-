import { useCallback, useSyncExternalStore } from "react";

// The admin must work inside one warehouse at a time (the orders API refuses "all warehouses").
// The choice lives in localStorage so it survives refresh and is shared by every admin page.
const KEY = "admin.warehouseId";
const listeners = new Set();

const read = () => {
  try {
    return localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
};

const subscribe = (callback) => {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
};

export const useSelectedWarehouse = () => {
  const warehouseId = useSyncExternalStore(subscribe, read, () => "");

  const setWarehouseId = useCallback((id) => {
    try {
      localStorage.setItem(KEY, String(id));
    } catch {
      // storage blocked: the choice just won't persist
    }
    listeners.forEach((callback) => callback());
  }, []);

  return { warehouseId, setWarehouseId };
};
