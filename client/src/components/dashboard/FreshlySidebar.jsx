import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Warehouse,
  Building2,
  ShoppingCart,
  Users,
  UserCog,
  BadgePercent,
  Settings,
  ChevronLeft,
  Leaf,
  Sparkles,
  Tag,
} from "lucide-react";

const primaryItems = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Products", path: "/dashboard/products", icon: Package },
  { title: "Categories", path: "/dashboard/categories", icon: FolderTree },
  { title: "Inventory", path: "/dashboard/inventory", icon: Warehouse },
  { title: "Warehouses", path: "/dashboard/warehouses", icon: Building2 },
];

const managementItems = [
  { title: "Orders", path: "/dashboard/orders", icon: ShoppingCart },
  { title: "Customers", path: "/dashboard/customers", icon: Users },
  { title: "Staff & Admins", path: "/dashboard/staff", icon: UserCog },
  { title: "Promotions", path: "/dashboard/promotions", icon: BadgePercent },
  { title: "Assigned Promos", path: "/dashboard/assign-promotions", icon: Tag },
  { title: "Settings", path: "/dashboard/settings", icon: Settings },
];

const navigationSections = [
  { label: "Overview", items: primaryItems },
  { label: "Management", items: managementItems },
];

const FreshlySidebar = ({ collapsed, onToggle, user, isMobile = false }) => {
  const location = useLocation();
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.name || "Admin";
  const contactDetail = user?.email || user?.phone || "Store Admin";
  const role = user?.role || "Store Admin";

  const positionClasses = isMobile
    ? "fixed left-0 top-0 z-30 h-screen"
    : "sticky top-0 z-30 h-screen";

  const isActiveRoute = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`${positionClasses} flex flex-col border-r border-white/10 bg-primary text-white shadow-[14px_0_48px_-30px_hsl(var(--primary)/0.95)] transition-all duration-300 ${
        collapsed ? "w-17" : "w-64"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-white/10 to-transparent" />

      <div className="relative flex h-20 items-center gap-3 border-b border-white/10 px-4">
        <div className="absolute inset-x-4 bottom-0 h-px bg-linear-to-r from-transparent via-white/25 to-transparent" />
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-warning shadow-[0_14px_22px_-14px_hsl(var(--warning)/0.95)]">
          <Leaf className="h-5 w-5 text-white" />
          <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-primary p-0.5 text-accent" />
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <span className="block truncate font-display text-lg font-bold tracking-tight text-white">Freshly</span>
            {/* <span className="block text-[11px] uppercase tracking-[0.14em] text-white/65">Premium Console</span> */}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <div className="space-y-5">
          {navigationSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
                  {section.label}
                </p>
              )}

              <ul className="space-y-1.5">
                {section.items.map((item) => {
                  const isActive = isActiveRoute(item.path);

                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-primary-foreground text-primary shadow-[0_12px_24px_-14px_hsl(var(--primary-foreground)/0.9)]"
                            : "text-white/75 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            isActive ? "bg-primary/10" : "bg-white/8 group-hover:bg-white/12"
                          }`}
                        >
                          <item.icon className="h-4.5 w-4.5" />
                        </span>
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="px-3 pb-3">
        {!collapsed && (
          <div className="mb-2 rounded-xl border border-white/12 bg-white/8 p-3">
            <p className="truncate text-xs font-semibold text-white">{fullName}</p>
            <p className="mt-0.5 truncate text-[11px] text-white/70">{contactDetail}</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-accent/70">{role}</p>
          </div>
        )}

        <button
          onClick={onToggle}
          className="group relative flex h-11 w-full items-center justify-center rounded-xl border border-white/12 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft className={`h-5 w-5 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>
    </aside>
  );
};

export default FreshlySidebar;
