import { ArrowLeftRight, Bell, History, LayoutDashboard, LogOut, Package, Search, UserRound } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { notify } from "@/lib/notify";
import { ME } from "@/lib/partnerDemoData";
import { signOutPartner } from "@/lib/partnerSession";
import { Avatar, StatusPill } from "./PartnerBits";

const NAV = [
  { to: "/partner/web", label: "Today", icon: LayoutDashboard, end: true },
  { to: "/partner/web/orders", label: "Orders", icon: Package },
  { label: "Handovers", icon: ArrowLeftRight, badge: 1 }, // no desktop page in the design
  { to: "/partner/web/history", label: "History", icon: History },
  { to: "/partner/web/profile", label: "Profile", icon: UserRound },
];

const itemClass = "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors";

const LogOutButton = () => {
  const navigate = useNavigate();
  const signOut = async () => {
    await signOutPartner();
    navigate("/partner/web/login", { replace: true });
  };
  return (
    <button type="button" onClick={signOut} className={`${itemClass} mt-3 w-full text-destructive hover:bg-muted`}>
      <LogOut className="h-4 w-4" />
      Log out
    </button>
  );
};

// Desktop partner workspace: sidebar + header. Pass `search`/`onSearch` to show the search box.
const WebShell = ({ title, subtitle, search, onSearch, children }) => (
  <div className="flex min-h-dvh bg-muted text-foreground">
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-white p-4 md:flex">
      <div className="px-2 pb-6 pt-1">
        <span className="font-display text-xl font-bold text-primary">freshly</span>
        <span className="ml-2 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-accent-foreground">PARTNER</span>
      </div>
      <nav aria-label="Main" className="flex-1 space-y-1">
        {NAV.map(({ to, label, icon, end, badge }) => {
          const Icon = icon;
          return to ? (
            <NavLink
              key={label}
              to={to}
              end={end}
              className={({ isActive }) => `${itemClass} ${isActive ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ) : (
            <button
              key={label}
              type="button"
              onClick={() => notify.notWired("Handovers on desktop")}
              className={`${itemClass} w-full text-muted-foreground hover:bg-muted`}
            >
              <Icon className="h-4 w-4" />
              {label}
              <span className="ml-auto rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">{badge}</span>
            </button>
          );
        })}
      </nav>
      <div className="flex items-center gap-2.5 border-t border-border pt-4">
        <Avatar initials={ME.initials} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{ME.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {ME.vehicleNumber} · {ME.vehicle}
          </p>
        </div>
        <StatusPill status="Online" />
      </div>
      <LogOutButton />
    </aside>

    <div className="min-w-0 flex-1">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-white px-6 py-4">
        <div>
          <h1 className="font-display text-xl font-semibold">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {onSearch && (
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                aria-label="Search orders"
                placeholder="Search order ID or customer"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                className="h-9 w-64 rounded-full border border-border bg-muted pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </label>
          )}
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => notify.notWired("Partner notifications")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </header>
      <main className="space-y-5 p-6">{children}</main>
    </div>
  </div>
);

export default WebShell;
