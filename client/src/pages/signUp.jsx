import React, { useState } from 'react';
import  '../styles/signUp.css';

const signUp = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validatePhoneNumber = (phone) => {
    // Basic phone number validation (10-15 digits)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhoneNumber(value);
    setIsValid(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    if (!cleanPhone) {
      setIsValid(false);
      return;
    }
    
    if (!validatePhoneNumber(cleanPhone)) {
      setIsValid(false);
      return;
    }
    
    setIsSubmitted(true);
    console.log('Phone number submitted:', cleanPhone);
  };

  if (isSubmitted) {
    return (
      <div className="signup-container">
        <div className="signup-card success-card">
          <div className="success-icon">✓</div>
          <h2 className="success-title">Success!</h2>
          <p className="success-text">We've received your phone number: <strong>{phoneNumber}</strong></p>
          <p className="success-text">You'll receive a verification code shortly.</p>
          <button 
            className="signup-button"
            onClick={() => {
              setIsSubmitted(false);
              setPhoneNumber('');
            }}
          >
            Sign Up Another Number
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h1 className="signup-title">Sign Up</h1>
          <p className="signup-subtitle">Enter your phone number to get started</p>
        </div>
        
        <div className="signup-form">
          <div className="form-group">
            <label className="form-label">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="+1 (555) 123-4567"
              className={`form-input ${!isValid ? 'error' : ''}`}
            />
            {!isValid && (
              <span className="error-message">
                Please enter a valid phone number
              </span>
            )}
          </div>
          
          <button 
            onClick={handleSubmit}
            className="signup-btn"
          >
            Continue
          </button>
        </div>
        
        <div className="signup-footer">
          <p>
            By continuing, you agree to our{' '}
            <a href="#" className="link">Terms of Service</a> and{' '}
            <a href="#" className="link">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default signUp;