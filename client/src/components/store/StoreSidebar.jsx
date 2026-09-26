import { NavLink } from "react-router-dom";
import { ClipboardList, PackageCheck, Boxes, Settings } from "lucide-react";

const NAV_ITEMS = [
  { to: "/store", label: "Orders", icon: ClipboardList, end: true },
  { to: "/store/handover", label: "Handover", icon: PackageCheck },
  { to: "/store/stock", label: "Stock", icon: Boxes },
  { to: "/store/settings", label: "Settings", icon: Settings },
];

const StoreSidebar = ({ staff }) => {
  const initials = (staff?.name || "S")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-primary text-white">
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-warning text-primary font-bold">F</span>
        <div className="flex flex-col">
          <span className="font-bold">Freshly Store</span>
          <span className="text-xs text-white/70">Operations console</span>
        </div>
      </div>

      {staff?.warehouse_name && (
        <div className="px-4 pt-4 text-xs font-semibold uppercase tracking-wide text-white/60">
          {staff.warehouse_name}
        </div>
      )}

      <nav className="flex flex-col gap-1.5 p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                isActive ? "bg-white text-primary" : "text-white/85 hover:bg-white/10"
              }`
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 border-t border-white/10 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning text-sm font-bold text-primary">
          {initials}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{staff?.name || "Loading…"}</span>
          <span className="text-xs text-white/75">{staff?.designation || "Store staff"}</span>
        </div>
      </div>
    </aside>
  );
};

export default StoreSidebar;
