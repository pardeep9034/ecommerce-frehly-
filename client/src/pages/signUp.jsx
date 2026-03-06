import React, { useState } from "react";
import { useNavigate,Link } from "react-router-dom";
import "../styles/signUp.css";
import { Button } from "@/components/ui/button";
import OtpModal from "@/components/common/otpModal";
import Otp from "@/components/common/otpPage";
import RegisterModal from "@/components/common/registerModal";
import { signup } from "@/apis/authApi";
import { useMutation } from "@tanstack/react-query";

const SignUp = () => {

  const [phoneNumber, setPhoneNumber] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
   const {
  mutate,
  isPending,
} = useMutation({
  mutationFn: (payload) => signup(payload),
  onSuccess: () => {
    setShowOtpModal(true);
  },
  onError: (err) => {
    console.error("Signup failed", err);
  },
});
const navigate = useNavigate();

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{9,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
  };

  const handlePhoneChange = (e) => {
    setPhoneNumber(e.target.value);
    setIsValid(true);
  };

 const handleSubmit = (e) => {
  e.preventDefault();

  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");

  if (!cleanPhone || !validatePhoneNumber(cleanPhone)) {
    setIsValid(false);
    return;
  }

  mutate({ phone: cleanPhone });
};

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h1 className="signup-title">Sign Up</h1>
          <p className="signup-subtitle">
            Enter your phone number to get started
          </p>
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
  placeholder="Enter your phone number"
  maxLength={10}
  pattern="[0-9]{10}"
  className={`form-input ${!isValid ? "error" : ""}`}
/>

            {!isValid && (
              <span className="error-message">
                Please enter a valid phone number
              </span>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            variant="primary"
            size="lg"
            fullWidth
            disabled={isPending}
          >
            {isPending ? "Sending..." : "Continue"}
          </Button>
          <p className="link text-center mt-4"> <Link to="/login"> click here to Login</Link></p>
        </div>

        <div className="signup-footer">
          <p>
            By continuing, you agree to our{" "}
            <a href="#" className="link">Terms of Service</a> and{" "}
            <a href="#" className="link">Privacy Policy</a>
          </p>
        </div>
      </div>

      {/* ===== OTP MODAL ===== */}
      <OtpModal
        open={showOtpModal}
        onClose={() =>{ setShowOtpModal(false)}}
      >
        <Otp
          phone={phoneNumber}
          onSuccess={() => {
            setShowOtpModal(false);
            setShowRegisterModal(true);
            // redirect or update auth state here
          }}
        />
      </OtpModal>
      <RegisterModal
  open={showRegisterModal}
  phone={phoneNumber}
  onClose={() => setShowRegisterModal(false)}
  onSuccess={(data) => {
    setShowRegisterModal(false);
    navigate('/')
    
  }}
/>
    </div>
  );
};

export default SignUp;