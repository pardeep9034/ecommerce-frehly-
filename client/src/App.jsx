import { BrowserRouter as Router, Navigate, Outlet, Routes, Route, useLocation } from "react-router-dom";
import PublicLayout from "./components/freshly/PublicLayout";
import "./styles/app.css";
import { lazy, Suspense, useEffect } from "react";
import { loginSuccess, logout } from "./redux/authSlice";
import { useDispatch } from "react-redux";
import { getToken, getTokenRole } from "@/lib/tokenStorage";
import usePartnerApplication from "@/hooks/use-partnerApplication";

// Route-level code splitting: storefront and admin dashboard are separate bundles, so shoppers never download
// admin code (and vice versa). Only the router shell and PublicLayout load up front.
const Home = lazy(() => import("./pages/freshly/Home"));
const LoginPage = lazy(() => import("./components/freshly/LoginPage"));
const SignUp = lazy(() => import("./pages/freshly/SignUp"));
const OtpPage = lazy(() => import("./components/freshly/OtpPage"));
const Shop = lazy(() => import("./pages/freshly/Shop"));
const ForgetPassword = lazy(() => import("./components/freshly/ForgetPassword"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const Products = lazy(() => import("./pages/dashboard/Products"));
const ProductDetail = lazy(() => import("./pages/dashboard/ProductDetail"));
const Categories = lazy(() => import("./pages/dashboard/Categories"));
const Inventory = lazy(() => import("./pages/dashboard/Inventory"));
const Promotions = lazy(() => import("./pages/dashboard/Promotions"));
const PromotionItems = lazy(() => import("./pages/dashboard/PromotionItems"));
const AssignPromotions = lazy(() => import("./pages/dashboard/AssignPromotions"));
const MyOrders = lazy(() => import("./pages/freshly/MyOrders"));
const OrderDetail = lazy(() => import("./pages/freshly/OrderDetail"));
const ShopProductDetail = lazy(() => import("./pages/freshly/ShopProductDetail"));
const About = lazy(() => import("./pages/freshly/About"));
const Profile = lazy(() => import("./pages/freshly/Profile"));
const Contact = lazy(() => import("./pages/freshly/Contact"));
const DashboardLayout = lazy(() => import("./components/dashboard/DashboardLayout"));
const CartPage = lazy(() => import("./pages/freshly/CartPage"));
const PhoneLoginPage = lazy(() => import("./components/freshly/PhoneLoginPage"));
const AdminLogin = lazy(() => import("./pages/dashboard/AdminLogin"));
const UnitsPage = lazy(() => import("./pages/dashboard/UnitsPage"));
const BrandPage = lazy(() => import("./pages/dashboard/BrandPage"));
const ProductTypePage = lazy(() => import("./pages/dashboard/ProductTypePage"));
const ProductAttributePage = lazy(() => import("./pages/dashboard/ProductAttributePage"));
const VariantPage = lazy(() => import("./pages/dashboard/VariantPage"));
const WarehousePage = lazy(() => import("./pages/dashboard/WarehousePage"));
const StockMovementPage = lazy(() => import("./pages/dashboard/StockMovementPage"));
const StockReservationPage = lazy(() => import("./pages/dashboard/StockReservationPage"));
const Zones = lazy(() => import("./pages/dashboard/Zones"));
const Customers = lazy(() => import("./pages/dashboard/Customers"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const Orders = lazy(() => import("./pages/dashboard/Orders"));
const AdminOrderDetail = lazy(() => import("./pages/dashboard/AdminOrderDetail"));
const DeliveryPartners = lazy(() => import("./pages/dashboard/DeliveryPartners"));
const DeliveryPartnerDetail = lazy(() => import("./pages/dashboard/DeliveryPartnerDetail"));
const AddDeliveryPartner = lazy(() => import("./pages/dashboard/AddDeliveryPartner"));
const PartnerApplicationReview = lazy(() => import("./pages/dashboard/PartnerApplicationReview"));
// Delivery-partner app: phone screens at /partner/*, desktop workspace at /partner/web/*. Guarded by RequirePartner; Home and the delivery screens still run on demo data.
const PartnerLogin = lazy(() => import("./pages/partner/Login"));
const PartnerForgotPassword = lazy(() => import("./pages/partner/ForgotPassword"));
const PartnerHome = lazy(() => import("./pages/partner/Home"));
const PartnerPickup = lazy(() => import("./pages/partner/Pickup"));
const PartnerDeliver = lazy(() => import("./pages/partner/Deliver"));
const PartnerConfirm = lazy(() => import("./pages/partner/Confirm"));
const PartnerFailed = lazy(() => import("./pages/partner/Failed"));
const PartnerHandover = lazy(() => import("./pages/partner/Handover"));
const PartnerHistory = lazy(() => import("./pages/partner/History"));
const PartnerProfile = lazy(() => import("./pages/partner/Profile"));
const PartnerWebLogin = lazy(() => import("./pages/partner/web/Login"));
const PartnerWebToday = lazy(() => import("./pages/partner/web/Today"));
const PartnerWebOrders = lazy(() => import("./pages/partner/web/Orders"));
const PartnerWebHistory = lazy(() => import("./pages/partner/web/History"));
const PartnerWebProfile = lazy(() => import("./pages/partner/web/Profile"));
const PartnerApply = lazy(() => import("./pages/partner/apply/Apply"));
const PartnerDocuments = lazy(() => import("./pages/partner/apply/Documents"));
const PartnerStatus = lazy(() => import("./pages/partner/apply/Status"));

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-muted text-sm text-muted-foreground">Loading…</div>
);

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "OPS_STAFF"];

const hasAdminAccess = () => ADMIN_ROLES.includes(getTokenRole(getToken()));

// Partner screens need a DELIVERY_PARTNER token. The 10-minute sign-up token counts, so an applicant can reach
// Documents and Status; the two login pages, /partner/forgot-password and /partner/apply stay public. useLocation re-runs the check on every
// navigation, and its path picks the login screen: the desktop workspace has its own.
const RequirePartner = () => {
  const { pathname } = useLocation();
  if (getTokenRole(getToken()) !== "DELIVERY_PARTNER") {
    return <Navigate to={pathname.startsWith("/partner/web") ? "/partner/web/login" : "/partner/login"} replace />;
  }
  if (pathname.startsWith("/partner/apply")) return <Outlet />;
  return <RequireApproved />;
};

// Same rule as sign-in (lib/partnerSession.js): the work screens need an APPROVED application, or none at all
// (a partner created by staff). Anyone still applying goes to their status page.
const RequireApproved = () => {
  const { application, isLoading, error } = usePartnerApplication();
  if (isLoading) return <PageLoader />;
  if (!error && (application === null || application?.status === "APPROVED")) return <Outlet />;
  return <Navigate to="/partner/apply/status" replace />;
};

function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    const token = getToken();
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
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />

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
          <Route path="warehouses" element={<WarehousePage />} />
          <Route path="stock-movement" element={<StockMovementPage />} />
          <Route path="stock-reservation" element={<StockReservationPage />} />
          <Route path="delivery-zones" element={<Zones />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:orderId" element={<AdminOrderDetail />} />
          <Route path="customers" element={<Customers />} />
          <Route path="delivery-partners" element={<DeliveryPartners />} />
          <Route path="delivery-partners/new" element={<AddDeliveryPartner />} />
          <Route path="delivery-partners/applications/:applicationId" element={<PartnerApplicationReview />} />
          <Route path="delivery-partners/:partnerId" element={<DeliveryPartnerDetail />} />
          <Route path="promotions" element={<Promotions />} />
          <Route path="promotions/:promotionId/items" element={<PromotionItems />} />
          <Route path="assign-promotions" element={<AssignPromotions />} />
          <Route path="settings" element={<Settings />} />
          <Route path="units"element={<UnitsPage/>}/>
          <Route path="brands"element={<BrandPage/>}/>
          <Route path="category" element={<Categories/>}/>
          <Route path="product-type"element={<ProductTypePage/>}/>
          <Route path="product-attribute"element={<ProductAttributePage/>}/>
          <Route path="variants"element={<VariantPage/>}/>

        </Route>

        {/* DELIVERY PARTNER APP */}
        <Route path="/partner" element={<Navigate to="/partner/home" replace />} />
        <Route path="/partner/login" element={<PartnerLogin />} />
        <Route path="/partner/forgot-password" element={<PartnerForgotPassword />} />
        <Route path="/partner/web/login" element={<PartnerWebLogin />} />
        <Route path="/partner/apply" element={<PartnerApply />} />
        <Route element={<RequirePartner />}>
          <Route path="/partner/home" element={<PartnerHome />} />
          <Route path="/partner/orders/:orderId/pickup" element={<PartnerPickup />} />
          <Route path="/partner/orders/:orderId/deliver" element={<PartnerDeliver />} />
          <Route path="/partner/orders/:orderId/confirm" element={<PartnerConfirm />} />
          <Route path="/partner/orders/:orderId/failed" element={<PartnerFailed />} />
          <Route path="/partner/handover" element={<PartnerHandover />} />
          <Route path="/partner/history" element={<PartnerHistory />} />
          <Route path="/partner/profile" element={<PartnerProfile />} />
          <Route path="/partner/web" element={<PartnerWebToday />} />
          <Route path="/partner/web/orders" element={<PartnerWebOrders />} />
          <Route path="/partner/web/history" element={<PartnerWebHistory />} />
          <Route path="/partner/web/profile" element={<PartnerWebProfile />} />
          <Route path="/partner/apply/documents" element={<PartnerDocuments />} />
          <Route path="/partner/apply/status" element={<PartnerStatus />} />
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
      </Suspense>
    </Router>
  );
}

export default App;
