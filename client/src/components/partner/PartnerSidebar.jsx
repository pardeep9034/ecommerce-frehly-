import { NavLink } from "react-router-dom";
import { LayoutGrid, ListOrdered, History, UserCircle, Leaf } from "lucide-react";

// Handovers isn't a page yet — the "hand to another partner" flow needs a
// nearby-partner picker that only makes sense on the mobile PWA (see
// DELIVERY_PARTNER_MODULE.md), so it's left off this nav rather than built
// as a page with nothing behind it.
const navItems = [
  { title: "Today", path: "/partner", icon: LayoutGrid, end: true },
  { title: "Orders", path: "/partner/orders", icon: ListOrdered },
  { title: "History", path: "/partner/history", icon: History },
  { title: "Profile", path: "/partner/profile", icon: UserCircle },
];

const PartnerSidebar = ({ partner }) => {
  const initials = (partner?.name || "P")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-7 border-r border-border bg-white p-4">
      <div className="flex items-center gap-2 px-1">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
          <Leaf className="h-4 w-4" />
        </span>
        <span className="text-lg font-bold text-primary">freshly</span>
        <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[11px] font-bold text-warning-foreground">
          PARTNER
        </span>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map(({ title, path, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) =>
              `flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-colors ${
                isActive ? "bg-primary text-white font-semibold" : "text-foreground hover:bg-muted"
              }`
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            {title}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 rounded-2xl bg-muted p-3.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-sm font-bold text-success">
          {initials}
        </span>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <span className="truncate text-sm font-bold text-foreground">{partner?.name || "Loading..."}</span>
          <span className="truncate text-xs text-muted-foreground">
            {partner ? `${partner.vehicle_number} · ${partner.vehicle_type}` : ""}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default PartnerSidebar;
