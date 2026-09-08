import React, { useState  } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../styles/loginPage.css';
import { useMutation } from '@tanstack/react-query';
import { loginWithPassword } from '@/apis/authApi';
import { loginSuccess } from '@/redux/authSlice';
import { useDispatch } from 'react-redux';
import {setCart} from '@/redux/cartSlice';
import { Link } from 'react-router-dom';
import { getUserCart } from '@/apis/cartApi';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    phoneNumber: location.state?.phone || '',
    password: ''
  });

  const [errors, setErrors] = useState({
    phoneNumber: false,
    password: false,
    general: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: loginWithPassword,
    onSuccess: async (data) => {
      localStorage.setItem("token", data.data.accessToken);
      setIsLoggedIn(true);
      navigate('/');
        dispatch(
      loginSuccess({
        // user: data.user,
        token: data.data.accessToken,
      })
      
    );
      const response = await getUserCart();
      dispatch(setCart(response.data.items));

    },
    onError: (err) => {
      setErrors((prev) => ({
        ...prev,
        general:
          err?.response?.data?.message || "Invalid credentials",
      }));
    },
  });

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: false,
      general: ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {
      phoneNumber: false,
      password: false,
      general: ''
    };

    const cleanPhone = formData.phoneNumber.replace(/[\s\-\(\)]/g, '');

    if (!cleanPhone || !validatePhoneNumber(cleanPhone)) {
      newErrors.phoneNumber = true;
    }

    if (!formData.password || !validatePassword(formData.password)) {
      newErrors.password = true;
    }

    setErrors(newErrors);

    if (newErrors.phoneNumber || newErrors.password) return;
const guest_cart = localStorage.getItem('cart');
    mutate({
      phone: cleanPhone,
      password: formData.password,
      guest_cart: guest_cart ? JSON.parse(guest_cart) : []
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  if (isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card success-card">
          <div className="success-icon">👋</div>
          <h2 className="success-title">Welcome Back!</h2>
          <p className="success-text">You have successfully logged in.</p>
          <p className="success-text">
            Phone: <strong>{formData.phoneNumber}</strong>
          </p>
          <button
            className="login-btn"
            onClick={() => navigate('/')}
          >
            Go to homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="bg-red-500 login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        <div className="login-form">
          {errors.general && (
            <div className="general-error">
              {errors.general}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) =>
                handleInputChange('phoneNumber', e.target.value)
              }
              placeholder="enter your phone number"
              className={`form-input ${
                errors.phoneNumber ? 'error' : ''
              }`}
              autoComplete="tel"
               maxLength={10}
  pattern="[0-9]{10}"
            />
            {errors.phoneNumber && (
              <span className="error-message">
                Please enter a valid phone number
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) =>
                  handleInputChange('password', e.target.value)
                }
                placeholder="Enter your password"
                className={`form-input ${
                  errors.password ? 'error' : ''
                }`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="password-toggle"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <p className="forgot-password-link"><Link to="/forgot-password">Forgot Password?</Link></p>
            {errors.password && (
              <span className="error-message">
                Password must be at least 6 characters long
              </span>
            )}
          </div>

          <button
            onClick={handleSubmit}
            className={`login-btn login-btn-primary ${
              isPending ? 'loading' : ''
            }`}
            disabled={isPending}
          >
            {isPending ? 'Signing In...' : 'Sign In'}
          </button>
          <p className="signup-link">Don't have an account? <Link to="/signup">Sign Up</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
