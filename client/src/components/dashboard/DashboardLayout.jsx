import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { Outlet, useLocation } from "react-router-dom";
import { getProfile } from "@/apis/authApi";
import FreshlySidebar from "./FreshlySidebar";
import FreshlyHeader from "./FreshlyHeader";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/dashboard/products": "Products",
  "/dashboard/products/brands":"Brands",
  "/dashboard/categories": "Categories",
  "/dashboard/inventory": "Inventory",
  "/dashboard/warehouses": "Warehouses",
  "/dashboard/warehouses/new": "Add warehouse",
  "/dashboard/staff": "Staff & admins",
  "/dashboard/staff/new": "Add user",
  "/dashboard/orders": "Orders",
  "/dashboard/customers": "Customers",
  "/dashboard/delivery-partners": "Delivery partners",
  "/dashboard/discounts": "Discounts",
  "/dashboard/settings": "Settings",
};

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const reduxUser = useSelector((state) => state.auth.user);
  // AuthLoader only restores state.auth.user for CUSTOMER tokens (storefront
  // sessions), so it's always null for admin/super-admin/ops-staff — the
  // sidebar/header never had real data to show. Fetch the admin's own
  // profile directly instead (same call Settings.jsx already makes).
  const { data: profile } = useQuery({ queryKey: ["auth-profile"], queryFn: getProfile });
  const user = profile || reduxUser;
  // Detail pages (/dashboard/warehouses/12) take their section title.
  const titlePath = Object.keys(pageTitles)
    .filter((path) => location.pathname === path || location.pathname.startsWith(`${path}/`))
    .sort((a, b) => b.length - a.length)[0];
  const title = pageTitles[titlePath] || "Freshly";

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative h-dvh overflow-hidden bg-muted text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-warning/10 blur-3xl" />
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-foreground/35 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {mobileOpen && <FreshlySidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} user={user} isMobile />}

      <div className="relative h-full lg:flex">
        <div className="hidden shrink-0 lg:block">
          <FreshlySidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} user={user} />
        </div>

        <div className="relative flex h-full min-w-0 w-full flex-col lg:flex-1">
          <FreshlyHeader
            title={title}
            sidebarCollapsed={collapsed}
            onMenuClick={() => setMobileOpen(!mobileOpen)}
            user={user}
          />

          {/* Only <main> scrolls; the sidebar and header stay put. */}
          <main className="relative min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden">
            <div className="relative min-h-[calc(100vh-4rem-1.5rem)] overflow-hidden rounded-2xl border border-white/80 bg-white/85 p-3 shadow-[0_20px_40px_-28px_hsl(var(--foreground)/0.45)] backdrop-blur-md sm:p-4 lg:p-5">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/35 to-transparent" />
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
