// App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/common/navbar';
// import Footer from './components/Layout/Footer';
import Home from './pages/home';
import Login from  './components/common/loginPage';
import SignUp from './pages/signUp';
import OtpPage from './components/common/otpPage';
import Shop from './pages/shop';
// import Products from './pages/Products';
// import ProductDetail from './pages/ProductDetail';
// import Cart from './pages/Cart';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import Profile from './pages/Profile';
// import Checkout from './pages/Checkout
import './styles/app.css';
function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/otp" element={<OtpPage />} />
            {/* <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/checkout" element={<Checkout />} /> */}
          </Routes>
        </main>
        {/* <Footer /> */}
      </div>
    </Router>
  );
}

export default App;