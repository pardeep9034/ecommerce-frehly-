import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  BadgePercent,
  Tag,
  Package,
  Layers,
  FolderTree,
  Award,
  Shapes,
  SlidersHorizontal,
  Ruler,
  Warehouse,
  ArrowLeftRight,
  Clock,
  Building2,
  Map,
  Bike,
  UserCog,
  Settings,
  ChevronLeft,
  LogOut,
  Leaf,
  Sparkles,
} from "lucide-react";
import { logout } from "@/redux/authSlice";

const navigationSections = [
  {
    label: null,
    items: [{ title: "Dashboard", path: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Sales",
    items: [
      { title: "Orders", path: "/dashboard/orders", icon: ShoppingCart },
      { title: "Customers", path: "/dashboard/customers", icon: Users },
      { title: "Promotions", path: "/dashboard/promotions", icon: BadgePercent },
      { title: "Assigned Promos", path: "/dashboard/assign-promotions", icon: Tag },
    ],
  },
  {
    label: "Catalog",
    items: [
      { title: "Products", path: "/dashboard/products", icon: Package },
      { title: "Variants", path: "/dashboard/variants", icon: Layers },
      { title: "Categories", path: "/dashboard/categories", icon: FolderTree },
      { title: "Brands", path: "/dashboard/brands", icon: Award },
      { title: "Product types", path: "/dashboard/product-type", icon: Shapes },
      { title: "Attributes", path: "/dashboard/product-attribute", icon: SlidersHorizontal },
      { title: "Units", path: "/dashboard/units", icon: Ruler },
    ],
  },
  {
    label: "Inventory",
    items: [
      { title: "Stock", path: "/dashboard/inventory", icon: Warehouse },
      { title: "Stock movements", path: "/dashboard/stock-movement", icon: ArrowLeftRight },
      { title: "Reservations", path: "/dashboard/stock-reservation", icon: Clock },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Warehouses", path: "/dashboard/warehouses", icon: Building2 },
      { title: "Delivery zones", path: "/dashboard/delivery-zones", icon: Map },
      { title: "Delivery partners", path: "/dashboard/delivery-partners", icon: Bike },
      { title: "Staff & admins", icon: UserCog, disabled: true },
    ],
  },
  {
    label: null,
    items: [{ title: "Settings", path: "/dashboard/settings", icon: Settings }],
  },
];

const getInitials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "A";

const FreshlySidebar = ({ collapsed, onToggle, user, isMobile = false }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
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

  const handleLogout = () => {
    dispatch(logout());
    navigate("/admin/login");
  };

  return (
    <aside
      className={`${positionClasses} flex flex-col border-r border-white/10 bg-primary text-white shadow-[14px_0_48px_-30px_hsl(var(--primary)/0.95)] transition-all duration-300 ${
        collapsed ? "w-17" : "w-64"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-white/10 to-transparent" />

      <div className="relative flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="absolute inset-x-4 bottom-0 h-px bg-linear-to-r from-transparent via-white/25 to-transparent" />
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent shadow-[0_14px_22px_-14px_hsl(var(--accent)/0.95)]">
          <Leaf className="h-4.5 w-4.5 text-white" />
          <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-primary p-0.5 text-accent" />
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <span className="block truncate font-display text-base font-bold tracking-tight text-white">Freshly</span>
            <span className="block text-[11px] text-white/65">Admin</span>
          </div>
        )}
      </div>

      <nav aria-label="Admin" className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-4">
          {navigationSections.map((section, sectionIndex) => (
            <div key={section.label || `section-${sectionIndex}`}>
              {section.label && !collapsed && (
                <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                  {section.label}
                </p>
              )}

              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  if (item.disabled) {
                    return (
                      <li key={item.title}>
                        <span
                          className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/40"
                          title="Coming soon"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                            <item.icon className="h-4 w-4" />
                          </span>
                          {!collapsed && <span className="flex-grow">{item.title}</span>}
                          {!collapsed && (
                            <span className="text-[10px] uppercase tracking-wide text-white/30">Soon</span>
                          )}
                        </span>
                      </li>
                    );
                  }

                  const isActive = isActiveRoute(item.path);

                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={`group relative flex items-center gap-3 rounded-lg px-2 py-2 my-2 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-white text-primary font-bold shadow-[0_12px_24px_-14px_hsl(var(--primary-foreground)/0.9)]"
                            : "text-white/80 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            isActive ? "bg-primary/10" : "bg-white/8 group-hover:bg-white/12"
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
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
          <div className="mb-2 flex items-center gap-2.5 rounded-xl border border-white/12 bg-white/8 p-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-primary">
              {getInitials(fullName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{fullName}</p>
              <p className="mt-0.5 truncate text-[11px] text-white/70">{contactDetail}</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-accent/80">{role}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}

        <button
          onClick={onToggle}
          className="group relative flex h-11 w-full items-center justify-center rounded-xl border border-white/12 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft className={`h-5 w-5 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>

        {collapsed && (
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="mt-2 flex h-11 w-full items-center justify-center rounded-xl border border-white/12 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
};

export default FreshlySidebar;
