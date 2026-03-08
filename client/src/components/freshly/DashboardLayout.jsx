import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import FreshlySidebar from "./FreshlySidebar";
import FreshlyHeader from "./FreshlyHeader";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/dashboard/products": "Products",
  "/dashboard/categories": "Categories",
  "/dashboard/inventory": "Inventory",
  "/dashboard/orders": "Orders",
  "/dashboard/customers": "Customers",
  "/dashboard/discounts": "Discounts",
  "/dashboard/settings": "Settings",
};

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Freshly";

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#f3f6f3] text-[#1f2937]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#0f5132]/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-[#b8860b]/10 blur-3xl" />
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-[#1f2937]/35 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {mobileOpen && <FreshlySidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} isMobile />}

      <div className="relative min-h-screen lg:flex">
        <div className="hidden shrink-0 lg:block">
          <FreshlySidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </div>

        <div className="relative min-h-screen w-full lg:flex-1">
          <FreshlyHeader
            title={title}
            sidebarCollapsed={collapsed}
            onMenuClick={() => setMobileOpen(!mobileOpen)}
          />

          <main className="relative min-h-[calc(100vh-4rem)] w-full overflow-x-hidden  ">
            <div className="relative min-h-[calc(100vh-4rem-1.5rem)] overflow-hidden rounded-2xl border border-white/80 bg-white/85 p-3 shadow-[0_20px_40px_-28px_rgba(31,41,55,0.45)] backdrop-blur-md sm:p-4 lg:p-5">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#0f5132]/35 to-transparent" />
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;