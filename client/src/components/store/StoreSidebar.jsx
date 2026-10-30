import { NavLink } from "react-router-dom";
import { ClipboardList, PackageCheck, Boxes, Settings, LogOut, Store, Undo2 } from "lucide-react";
import { getStoreDesignation } from "../../lib/storeRole";
import { deriveStage } from "../../lib/orderStage";
import { useStoreQueue } from "../../hooks/use-store";
import LogoutDialog from "./LogoutDialog";

const NAV_ITEMS = [
  { to: "/store", label: "Orders", icon: ClipboardList, end: true, counted: true },
  { to: "/store/handover", label: "Handover", icon: PackageCheck },
  { to: "/store/returns", label: "Returns", icon: Undo2 },
  { to: "/store/stock", label: "Stock", icon: Boxes },
  { to: "/store/settings", label: "Settings", short: "Me", icon: Settings },
];

// One nav for both layouts: a bottom tab bar on phones, the green sidebar from lg up.
// hideOnPhone drops the tab bar on full-screen task pages (order detail has its own footer).
const StoreSidebar = ({ staff, hideOnPhone }) => {
  const { orders } = useStoreQueue(staff?.warehouse_id);
  const openCount = orders.filter((order) => ![null, "CANCELLED", "RETURN"].includes(deriveStage(order))).length;
  const initials = (staff?.name || "S")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={`${hideOnPhone ? "hidden" : "fixed"} inset-x-0 bottom-0 z-30 border-t border-border bg-card lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-0 lg:bg-primary lg:text-white`}
    >
      <div className="hidden h-20 items-center gap-3 border-b border-white/10 px-4 lg:flex">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-warning text-white">
          <Store className="h-5 w-5" />
        </span>
        <div className="flex flex-col">
          <span className="text-lg font-bold">Freshly Store</span>
          <span className="text-xs text-white/75">Operations console</span>
        </div>
      </div>

      {staff?.warehouse_name && (
        <div className="hidden flex-col gap-1.5 px-3 pt-4 lg:flex">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">Store</span>
          <span className="truncate rounded-[10px] bg-white px-2.5 py-2.5 text-sm font-semibold text-foreground">
            {staff.warehouse_name}
          </span>
        </div>
      )}

      <nav aria-label="Store" className="flex h-[72px] items-center justify-around px-2 lg:h-auto lg:flex-col lg:items-stretch lg:justify-start lg:gap-1.5 lg:p-3 lg:pt-5">
        {NAV_ITEMS.map(({ to, label, short, icon: Icon, end, counted }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-[52px] min-w-16 flex-col items-center justify-center gap-1 text-xs transition-colors lg:min-h-0 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-xl lg:px-3 lg:py-2 lg:text-sm ${
                isActive
                  ? "font-bold text-primary lg:bg-white"
                  : "font-medium text-muted-foreground lg:text-white/85 lg:hover:bg-white/10"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full lg:h-8 lg:w-8 lg:rounded-lg ${
                    isActive ? "bg-[#E3F1E8] lg:bg-primary/10" : "lg:bg-white/10"
                  }`}
                >
                  <Icon className="h-5 w-5 lg:h-[18px] lg:w-[18px]" />
                </span>
                <span className="lg:hidden">{short || label}</span>
                <span className="hidden lg:inline lg:flex-1">{label}</span>
                {counted && openCount > 0 && (
                  <span className="hidden rounded-full bg-[#FBBD23] px-2 text-xs font-bold text-foreground lg:inline">{openCount}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto hidden items-center gap-2.5 border-t border-white/10 p-4 lg:flex">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FBBD23] text-sm font-bold text-foreground">
          {initials}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">{staff?.name || "Loading…"}</span>
          <span className="text-xs text-white/75">{staff?.designation || getStoreDesignation()}</span>
        </div>
        <LogoutDialog>
          <button
            type="button"
            aria-label="Log out"
            title="Log out"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </LogoutDialog>
      </div>
    </aside>
  );
};

export default StoreSidebar;
