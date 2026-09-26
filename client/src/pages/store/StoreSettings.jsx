import { useOutletContext } from "react-router-dom";
import { logout as logoutAction } from "../../redux/authSlice";
import { useDispatch } from "react-redux";

// Only "My profile" + logout — the design's "Store settings" tab (hours,
// pack-by target, auto-assign, racks) has no backing fields anywhere in
// Warehouse.model.js. Rather than ship toggles that save nothing (the same
// call made for delivery-partner's online/offline toggle), it's left out —
// see STORE_OPERATIONS_MODULE.md, "Deferred".
const StoreSettings = () => {
  const { staff } = useOutletContext();
  const dispatch = useDispatch();

  const initials = (staff?.name || "S")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(logoutAction());
    window.location.replace("/store/login");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Your account</p>
      </div>

      <section className="flex max-w-sm flex-col items-center gap-2 rounded-2xl border border-border bg-white p-6 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-warning/20 text-2xl font-bold text-warning">
          {initials}
        </span>
        <h2 className="text-lg font-bold text-foreground">{staff?.name || "Loading…"}</h2>
        <p className="text-sm text-muted-foreground">
          {staff?.designation || "Store staff"} · {staff?.warehouse_name || "—"}
        </p>
        <p className="text-sm text-muted-foreground">{staff?.phone}</p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-destructive"
        >
          End shift & log out
        </button>
      </section>
    </div>
  );
};

export default StoreSettings;
