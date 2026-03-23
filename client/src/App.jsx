import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./components/common/loginPage";
import SignUp from "./pages/SignUp";
import OtpPage from "./components/common/otpPage";
import Shop from "./pages/Shop";
import ForgetPassword from "./components/common/forgetPassword";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Categories from "./pages/Categories";
import Inventory from "./pages/Inventory";
import PlaceholderPage from "./pages/PlaceholderPage";
import MyOrders from "./pages/MyOrders";
import OrderDetail from "./pages/OrderDetail";
import ShopProductDetail from "./pages/ShopProductDetail";
import About from "./pages/About";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
import PublicLayout from "./components/layout/PublicLayout";
import DashboardLayout from "./components/freshly/DashboardLayout";
import "./styles/app.css";
import { useEffect } from "react";
import { loginSuccess, logout } from "./redux/authSlice";
import { useDispatch } from "react-redux";

function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(loginSuccess({ token }));
    } else {
      dispatch(logout());
    }
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/orders/:orderId" element={<OrderDetail />} />
          <Route path="/products/:productId" element={<ShopProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/otp" element={<OtpPage />} />
          <Route path="/forgot-password" element={<ForgetPassword />} />
        </Route>

        {/* DASHBOARD ROUTES */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:productId" element={<ProductDetail />} />
          <Route path="categories" element={<Categories />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="orders" element={<PlaceholderPage />} />
          <Route path="customers" element={<PlaceholderPage />} />
          <Route path="discounts" element={<PlaceholderPage />} />
          <Route path="settings" element={<PlaceholderPage />} />
        </Route>

        {/* 404 - FALLBACK */}
        <Route path="*" element={
          <div className="flex h-screen flex-col items-center justify-center bg-[#f9fafb] text-center p-4">
             <h1 className="text-6xl font-black text-[#0f5132]">404</h1>
             <p className="mt-4 text-xl font-bold text-gray-900">Oops! Page not found.</p>
             <p className="mt-2 text-gray-500">The page you are looking for doesn't exist or has been moved.</p>
             <a href="/" className="mt-8 rounded-xl bg-[#0f5132] px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#0b4128]">
               Back to Home
             </a>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;