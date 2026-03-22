import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Login from "./components/common/loginPage";
import SignUp from "./pages/signUp";
import OtpPage from "./components/common/otpPage";
import Shop from "./pages/shop";
import ForgetPassword from "./components/common/forgetPassword";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Categories from "./pages/Categories";
import Inventory from "./pages/Inventory";
import PlaceholderPage from "./pages/PlaceholderPage";
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
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/otp" element={<OtpPage />} />
          <Route path="/forgot-password" element={<ForgetPassword />} />
        </Route>

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
      </Routes>
    </Router>
  );
}

export default App;