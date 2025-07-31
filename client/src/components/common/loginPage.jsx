import React, { useState } from 'react';
import '../../styles/loginPage.css';

const loginPage = () => {
  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    phoneNumber: false,
    password: false,
    general: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user starts typing
    setErrors(prev => ({
      ...prev,
      [field]: false,
      general: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {
      phoneNumber: false,
      password: false,
      general: ''
    };

    // Validate phone number
    const cleanPhone = formData.phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (!cleanPhone || !validatePhoneNumber(cleanPhone)) {
      newErrors.phoneNumber = true;
    }

    // Validate password
    if (!formData.password || !validatePassword(formData.password)) {
      newErrors.password = true;
    }

    setErrors(newErrors);

    // If there are validation errors, don't proceed
    if (newErrors.phoneNumber || newErrors.password) {
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      // Mock authentication logic
      if (formData.password === 'password123') {
        setIsLoggedIn(true);
        console.log('Login successful:', {
          phone: cleanPhone,
          timestamp: new Date().toISOString()
        });
      } else {
        setErrors(prev => ({
          ...prev,
          general: 'Invalid phone number or password. Please try again.'
        }));
      }
      setIsLoading(false);
    }, 1500);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card success-card">
          <div className="success-icon">👋</div>
          <h2 className="success-title">Welcome Back!</h2>
          <p className="success-text">You have successfully logged in.</p>
          <p className="success-text">Phone: <strong>{formData.phoneNumber}</strong></p>
          <button 
            className="login-btn"
            onClick={() => console.log('Navigate to dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        <div className="login-form">
          {errors.general && (
            <div className="general-error">
              {errors.general}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="+1 (555) 123-4567"
              className={`form-input ${errors.phoneNumber ? 'error' : ''}`}
              autoComplete="tel"
            />
            {errors.phoneNumber && (
              <span className="error-message">
                Please enter a valid phone number
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter your password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && (
              <span className="error-message">
                Password must be at least 6 characters long
              </span>
            )}
          </div>

          <div className="form-options">
            <label className="checkbox-wrapper">
              <input type="checkbox" className="checkbox" />
              <span className="checkbox-text">Remember me</span>
            </label>
            <a href="#" className="forgot-password-link">
              Forgot Password?
            </a>
          </div>

          <button 
            onClick={handleSubmit}
            className={`login-btn login-btn-primary ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </div>

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <a href="#" className="signup-link">
              Sign up here
            </a>
          </p>
          <div className="divider">
            <span>or</span>
          </div>
          <button className="login-btn-secondary login-btn">
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default loginPage;