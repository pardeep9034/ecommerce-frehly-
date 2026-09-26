import { BrowserRouter as Router, Navigate, Routes, Route } from "react-router-dom";
import Home from "./pages/freshly/Home";
import LoginPage from "./components/freshly/LoginPage";
import SignUp from "./pages/freshly/SignUp";
import OtpPage from "./components/freshly/OtpPage";
import Shop from "./pages/freshly/Shop";
import ForgetPassword from "./components/freshly/ForgetPassword";
import Dashboard from "./pages/dashboard/Dashboard";
import Products from "./pages/dashboard/Products";
import ProductDetail from "./pages/dashboard/ProductDetail";
import Categories from "./pages/dashboard/Categories";
import Inventory from "./pages/dashboard/Inventory";
import PlaceholderPage from "./pages/dashboard/PlaceholderPage";
import Promotions from "./pages/dashboard/Promotions";
import PromotionItems from "./pages/dashboard/PromotionItems";
import AssignPromotions from "./pages/dashboard/AssignPromotions";
import MyOrders from "./pages/freshly/MyOrders";
import OrderDetail from "./pages/freshly/OrderDetail";
import ShopProductDetail from "./pages/freshly/ShopProductDetail";
import About from "./pages/freshly/About";
import Profile from "./pages/freshly/Profile";
import Contact from "./pages/freshly/Contact";
import PublicLayout from "./components/freshly/PublicLayout";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import CartPage from "./pages/freshly/CartPage";
import PhoneLoginPage from "./components/freshly/PhoneLoginPage";
import AdminLogin from "./pages/dashboard/AdminLogin";
import UnitsPage from "./pages/dashboard/UnitsPage";
import "./styles/app.css";
import { useEffect } from "react";
import { loginSuccess, logout } from "./redux/authSlice";
import { useDispatch } from "react-redux";
import BrandPage from "./pages/dashboard/BrandPage";
import ProductTypePage from "./pages/dashboard/ProductTypePage";
import ProductAttributePage from "./pages/dashboard/ProductAttributePage";
import VariantPage from "./pages/dashboard/VariantPage";
import WarehousePage from "./pages/dashboard/WarehousePage";
import WarehouseDetailPage from "./pages/dashboard/WarehouseDetailPage";
import WarehouseNewPage from "./pages/dashboard/WarehouseNewPage";
import StaffPage from "./pages/dashboard/StaffPage";
import StaffNewPage from "./pages/dashboard/StaffNewPage";
import StockMovementPage from "./pages/dashboard/StockMovementPage";
import StockReservationPage from "./pages/dashboard/StockReservationPage";
import Orders from "./pages/dashboard/Orders";
import AdminOrderDetail from "./pages/dashboard/AdminOrderDetail";
import StoreLayout from "./components/store/StoreLayout";
import StoreLogin from "./pages/store/StoreLogin";
import StoreBoard from "./pages/store/StoreBoard";
import StoreOrderDetail from "./pages/store/StoreOrderDetail";
import StoreHandover from "./pages/store/StoreHandover";
import StoreStock from "./pages/store/StoreStock";
import StoreSettings from "./pages/store/StoreSettings";
import { STORE_ROLES } from "./lib/storeRole";
import { getTokenRole } from "./lib/auth";
import PartnerLayout from "./components/partner/PartnerLayout";
import PartnerLogin from "./pages/partner/PartnerLogin";
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import PartnerOrders from "./pages/partner/PartnerOrders";
import PartnerHistory from "./pages/partner/PartnerHistory";
import PartnerProfile from "./pages/partner/PartnerProfile";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "OPS_STAFF"];
const PARTNER_ROLES = ["DELIVERY_PARTNER"];

const hasAdminAccess = () => ADMIN_ROLES.includes(getTokenRole(localStorage.getItem("token")));
const hasStoreAccess = () => STORE_ROLES.includes(getTokenRole(localStorage.getItem("token")));
const hasPartnerAccess = () => PARTNER_ROLES.includes(getTokenRole(localStorage.getItem("token")));

function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && getTokenRole(token) === "CUSTOMER") {
      dispatch(loginSuccess({ token }));
    } else if (!token) {
      // No token at all: clear any stale auth state. A staff token IS present
      // but isn't a customer session — leave it in localStorage untouched so
      // an admin/super-admin browsing the storefront doesn't get signed out
      // of their dashboard session; just don't mark them as a logged-in shopper.
      dispatch(logout());
    }
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/store/login" element={<StoreLogin />} />
        <Route path="/partner/login" element={<PartnerLogin />} />

        {/* PUBLIC ROUTES */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/orders/:orderId" element={<OrderDetail />} />
          <Route path="/products/:productId" element={<ShopProductDetail />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/phone-login" element={<PhoneLoginPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/otp" element={<OtpPage />} />
          <Route path="/forgot-password" element={<ForgetPassword />} />
        </Route>

        {/* DASHBOARD ROUTES */}
        <Route
          path="/dashboard"
          element={hasAdminAccess() ? <DashboardLayout /> : <Navigate to="/admin/login" replace />}
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:productId" element={<ProductDetail />} />
          <Route path="categories" element={<Categories />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="inventory/stock-movement" element={<StockMovementPage />} />
          <Route path="inventory/stock-reservation" element={<StockReservationPage />} />
          <Route path="warehouses" element={<WarehousePage />} />
          <Route path="warehouses/new" element={<WarehouseNewPage />} />
          <Route path="warehouses/:warehouseId" element={<WarehouseDetailPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="staff/new" element={<StaffNewPage />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:orderId" element={<AdminOrderDetail />} />
          <Route path="customers" element={<PlaceholderPage />} />
          <Route path="promotions" element={<Promotions />} />
          <Route path="promotions/:promotionId/items" element={<PromotionItems />} />
          <Route path="assign-promotions" element={<AssignPromotions />} />
          <Route path="settings" element={<PlaceholderPage />} />
          <Route path="products/units"element={<UnitsPage/>}/>
          <Route path="products/brands"element={<BrandPage/>}/>
          <Route path="products/category" element={<Categories/>}/>
          <Route path="products/product-type"element={<ProductTypePage/>}/>
          <Route path="products/product-attribute"element={<ProductAttributePage/>}/>
          <Route path="products/variants"element={<VariantPage/>}/>

        </Route>

        {/* STORE OPERATIONS ROUTES */}
        <Route
          path="/store"
          element={hasStoreAccess() ? <StoreLayout /> : <Navigate to="/store/login" replace />}
        >
          <Route index element={<StoreBoard />} />
          <Route path="orders/:orderId" element={<StoreOrderDetail />} />
          <Route path="handover" element={<StoreHandover />} />
          <Route path="stock" element={<StoreStock />} />
          <Route path="settings" element={<StoreSettings />} />
        </Route>

        {/* DELIVERY PARTNER ROUTES */}
        <Route
          path="/partner"
          element={hasPartnerAccess() ? <PartnerLayout /> : <Navigate to="/partner/login" replace />}
        >
          <Route index element={<PartnerDashboard />} />
          <Route path="orders" element={<PartnerOrders />} />
          <Route path="history" element={<PartnerHistory />} />
          <Route path="profile" element={<PartnerProfile />} />
        </Route>

        {/* 404 - FALLBACK */}
        <Route path="*" element={
          <div className="flex h-screen flex-col items-center justify-center bg-muted text-center p-4">
             <h1 className="text-6xl font-black text-primary">404</h1>
             <p className="mt-4 text-xl font-bold text-gray-900">Oops! Page not found.</p>
             <p className="mt-2 text-gray-500">The page you are looking for doesn't exist or has been moved.</p>
             <a href="/" className="mt-8 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary/90">
               Back to Home
             </a>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
