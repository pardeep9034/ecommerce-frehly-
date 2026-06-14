import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../../styles/navbar.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Button } from "@/components/ui/button"
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { logout } from '@/redux/authSlice';
import { useQuery } from '@tanstack/react-query';
import { getProfile } from '@/apis/authApi';

import { 
  Search, 
  ShoppingCart, 
  User, 
  ClipboardList, 
  Settings, 
  LogOut, 
  Home as HomeIcon, 
  Store, 
  Info, 
  Mail,
  Leaf,
  Menu,
  X 
} from 'lucide-react';

// function Demo() {
//   return (
//     <div className="p-8 space-x-4">
//       <Button>Primary</Button>
//       <Button variant="accent">Accent</Button>
//       <Button variant="secondary">Secondary</Button>
//       <Button variant="danger">Delete</Button>
//       <Button loading>Loading</Button>
//       <Button size="lg">Large</Button>
//       <Button fullWidth>Full Width</Button>
//     </div>
//   )
// }

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

const cartCount = cartItems.length;
  const [user, setUser] = useState({
    avatar: "https://placehold.co/40x40",
    name: "Guest User",
    email: "No email provided"
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const token = localStorage.getItem("token");

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await getProfile();
      return res.data.data;
    },
    enabled: !!token,
  });


  const location = useLocation();
  const navigate = useNavigate();

  const navOptions = [
    { name: 'Home', path: '/', icon: HomeIcon },
    { name: 'Shop', path: '/shop', icon: Store },
    { name: 'My Orders', path: '/orders', icon: ClipboardList },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Contact', path: '/contact', icon: Mail },
  ];

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
    }


    
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  const handleLogout = () => {
    dispatch(logout());
    setUser(null);
    navigate('/login');
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsUserDropdownOpen(false);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
    setIsMobileMenuOpen(false);
  };

  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
  };

  return (
    <header className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo Section */}
        <div className="navbar-logo">
          <Link to="/" className="logo-link " onClick={closeAllMenus}>
            <img
              src="/logo.png"
              alt="Fresh Veggies Logo"
              className="logo-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            /> freshly
            <div className="logo-fallback">
              <i className="fas fa-leaf"></i>
              <span>Fresh Veggies</span>
            </div>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Navigation Links */}
        <nav className={`navbar-nav ${isMobileMenuOpen ? 'navbar-nav-open' : ''}`}>
          <ul className="nav-list">
            {navOptions.map((option) => (
              <li key={option.name} className="nav-item">
                <Link
                  to={option.path}
                  className={`nav-link ${location.pathname === option.path ? 'nav-link-active' : ''}`}
                  onClick={closeAllMenus}
                >
                  <option.icon className="h-4 w-4" />
                  <span>{option.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right Side Actions */}
        <div className="navbar-actions">
          {/* Search Button */}
          <button className="action-btn search-btn" aria-label="Search">
            <Search className="h-5 w-5" />
          </button>

          {/* Cart */}
          <Link to="/cart" className="action-btn cart-btn" onClick={closeAllMenus}>
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          {/* User Profile/Auth */}
          {isAuthenticated ? (
            <div className="user-menu">
              <button className="user-avatar" onClick={toggleUserDropdown}>
                <img
                  src={user?.avatar}
                  alt={data ? `${data.first_name} ${data.last_name}` : "User Avatar"}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="avatar-fallback">
                  <User className="h-5 w-5" />
                </div>
              </button>

              <div className={`user-dropdown ${isUserDropdownOpen ? 'user-dropdown-open' : ''}`}>
                <div className="user-info">
                  <span className="user-name">{data ? `${data.first_name} ${data.last_name}` : "Guest User"}</span>
                  <span className="user-email">{data?.email ?? "No email provided"}</span>
                </div>
                <div className="dropdown-divider"></div>
                <Link to="/profile" className="dropdown-item" onClick={closeAllMenus}>
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
                <Link to="/orders" className="dropdown-item" onClick={closeAllMenus}>
                  <ClipboardList className="h-4 w-4" />
                  <span>My Orders</span>
                </Link>
                <Link to="/settings" className="dropdown-item" onClick={closeAllMenus}>
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout-btn" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline btn-sm" onClick={closeAllMenus}>
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm" onClick={closeAllMenus}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {(isMobileMenuOpen || isUserDropdownOpen) && (
        <div className="mobile-overlay" onClick={closeAllMenus}></div>
      )}
    </header>
  );
};

export default Navbar;