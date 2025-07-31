import React, { useState, useRef, useEffect } from 'react';
import '../../styles/otpPage.css';

const OTPPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isValid, setIsValid] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  const phoneNumber = "+1 (555) 123-4567"; // This would come from props or context

  useEffect(() => {
    // Timer countdown
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  useEffect(() => {
    // Focus on first input when component mounts
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleInputChange = (index, value) => {
    // Only allow single digit
    if (value.length > 1) return;
    
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setIsValid(true);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Handle paste
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      setIsValid(true);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setIsValid(false);
      return;
    }

    // Simulate OTP verification
    if (otpString === '123456') {
      setIsSubmitted(true);
      console.log('OTP verified:', otpString);
    } else {
      setIsValid(false);
      // Clear OTP and focus first input
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setCanResend(false);
    setTimer(60);
    
    // Simulate API call
    setTimeout(() => {
      setIsResending(false);
      console.log('OTP resent to:', phoneNumber);
    }, 2000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isSubmitted) {
    return (
      <div className="otp-container">
        <div className="otp-card success-card">
          <div className="success-icon">✓</div>
          <h2 className="success-title">Verification Complete!</h2>
          <p className="success-text">Your phone number has been successfully verified.</p>
          <p className="success-text">Welcome to our platform!</p>
          <button 
            className="verify btn"
            onClick={() => console.log('Navigate to dashboard')}
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="otp-container">
      <div className="otp-card">
        <div className="otp-header">
          <h1 className="otp-title">Verify Your Phone</h1>
          <p className="otp-subtitle">
            We've sent a 6-digit code to<br />
            <strong>{phoneNumber}</strong>
          </p>
        </div>

        <div className="otp-form">
          <div className="otp-inputs">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`otp-input ${!isValid ? 'error' : ''}`}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          {!isValid && (
            <span className="error-message">
              Please enter a valid 6-digit code
            </span>
          )}

          <button 
            onClick={handleSubmit}
            className="verify btn"
            disabled={otp.join('').length !== 6}
          >
            Verify Code
          </button>
        </div>

        <div className="otp-footer">
          <div className="resend-section">
            {!canResend ? (
              <p className="timer-text">
                Resend code in {formatTime(timer)}
              </p>
            ) : (
              <button
                onClick={handleResendOTP}
                disabled={isResending}
                className="btn-link"
              >
                {isResending ? 'Sending...' : 'Resend Code'}
              </button>
            )}
          </div>
          
          <button 
            onClick={() => console.log('Go back to phone input')}
            className="btn-link"
          >
            Change Phone Number
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPPage;