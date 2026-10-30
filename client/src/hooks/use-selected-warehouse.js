import { useCallback, useSyncExternalStore } from "react";
import { currentStaff } from "@/lib/warehouseAccess";

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

// A store manager or store staff is locked to the store on their token (`locked`); the services only answer for it.
export const useSelectedWarehouse = () => {
  const stored = useSyncExternalStore(subscribe, read, () => "");

  const setWarehouseId = useCallback((id) => {
    try {
      localStorage.setItem(KEY, String(id));
    } catch {
      // storage blocked: the choice just won't persist
    }
    listeners.forEach((callback) => callback());
  }, []);

  const { isSuperAdmin, ownWarehouseId } = currentStaff();
  if (!isSuperAdmin) return { warehouseId: ownWarehouseId ?? "", setWarehouseId: () => {}, locked: true };
  return { warehouseId: stored, setWarehouseId, locked: false };
};
