import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../../styles/navbar.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  const navOptions = [
    { name: 'Home', path: '/', icon: 'fas fa-home' },
    { name: 'Shop', path: '/shop', icon: 'fas fa-store' },
    { name: 'My Orders', path: '/orders', icon: 'fas fa-clipboard-list' },
    { name: 'About', path: '/about', icon: 'fas fa-info-circle' },
    { name: 'Contact', path: '/contact', icon: 'fas fa-envelope' },
  ];

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    
    // Get cart count
    updateCartCount();
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((total, item) => total + item.quantity, 0));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo Section */}
        <div className="navbar-logo">
          <Link to="/" className="logo-link " onClick={closeMenu}>
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
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>

        {/* Navigation Links */}
        <nav className={`navbar-nav ${isMenuOpen ? 'navbar-nav-open' : ''}`}>
          <ul className="nav-list">
            {navOptions.map((option) => (
              <li key={option.name} className="nav-item">
                <Link
                  to={option.path}
                  className={`nav-link ${location.pathname === option.path ? 'nav-link-active' : ''}`}
                  onClick={closeMenu}
                >
                  <i className={option.icon}></i>
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
            <i className="fas fa-search"></i>
          </button>

          {/* Cart */}
          <Link to="/cart" className="action-btn cart-btn" onClick={closeMenu}>
            <i className="fas fa-shopping-cart"></i>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          {/* User Profile/Auth */}
          {user ? (
            <div className="user-menu">
              <button className="user-avatar" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <img 
                  src={user.avatar || "/images/default-avatar.png"} 
                  alt={user.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="avatar-fallback">
                  <i className="fas fa-user"></i>
                </div>
              </button>
              
              <div className={`user-dropdown ${isMenuOpen ? 'user-dropdown-open' : ''}`}>
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <span className="user-email">{user.email}</span>
                </div>
                <div className="dropdown-divider"></div>
                <Link to="/profile" className="dropdown-item" onClick={closeMenu}>
                  <i className="fas fa-user"></i>
                  <span>Profile</span>
                </Link>
                <Link to="/orders" className="dropdown-item" onClick={closeMenu}>
                  <i className="fas fa-clipboard-list"></i>
                  <span>My Orders</span>
                </Link>
                <Link to="/settings" className="dropdown-item" onClick={closeMenu}>
                  <i className="fas fa-cog"></i>
                  <span>Settings</span>
                </Link>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout-btn" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline btn-sm" onClick={closeMenu}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={closeMenu}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div className="mobile-overlay" onClick={closeMenu}></div>
      )}
    </header>
  );
};

export default Navbar;