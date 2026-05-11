import React, { useState, useRef, useEffect } from "react";
import "../../styles/otpPage.css";
import { verifyOtp, resendOtp } from "@/apis/authApi";

const Otp = ({ phone, onSuccess, onBack,type }) => {

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isValid, setIsValid] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  /* ================= TIMER ================= */

  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(countdown);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  /* ================= AUTO FOCUS ================= */

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  /* ================= INPUT CHANGE ================= */

  const handleInputChange = (index, value) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setIsValid(true);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /* ================= KEY HANDLING ================= */

  const handleKeyDown = (index, e) => {

    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  /* ================= PASTE ================= */

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");

    if (pastedData.length === 6) {
      setOtp(pastedData.split(""));
      setIsValid(true);
      inputRefs.current[5]?.focus();
    }
  };

  /* ================= VERIFY OTP ================= */

  const handleSubmit = async () => {

    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setIsValid(false);
      return;
    }

    setLoading(true);

    const response = await verifyOtp({phone, otp:otpString,type}).catch((err) => err);

    if (response?.data) {
      onSuccess(response.data);
      localStorage.setItem("token", response.data.accessToken);
      localStorage.setItem("resetToken", response.data.resetToken);
    } else {
      setIsValid(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }

    setLoading(false);
  };

  /* ================= RESEND OTP ================= */

  const handleResendOTP = async () => {

    setResending(true);
    setCanResend(false);

    const response = await resendOtp(phone,type).catch((err) => err);

    if (response?.data) {
      setTimer(60);
    } else {
      setCanResend(true);
    }

    setResending(false);
  };

  /* ================= FORMAT TIMER ================= */

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="otp-card">
      <div className="otp-header">
        <h2 className="otp-title">Verify Your Phone</h2>
        <p className="otp-subtitle">
          We've sent a 6-digit code to<br />
          <strong>{phone}</strong>
        </p>
      </div>

      <div className="otp-form">
        <div className="otp-inputs">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`otp-input ${!isValid ? "error" : ""}`}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {!isValid && (
          <span className="error-message">
            Invalid or expired OTP
          </span>
        )}

        <button
          onClick={handleSubmit}
          className="verify btn"
          disabled={loading || otp.join("").length !== 6}
        >
          {loading ? "Verifying..." : "Verify Code"}
        </button>
      </div>

      <div className="otp-footer">

        {!canResend ? (
          <p className="timer-text">
            Resend code in {formatTime(timer)}
          </p>
        ) : (
          <button
            onClick={handleResendOTP}
            disabled={resending}
            className="btn-link"
          >
            {resending ? "Sending..." : "Resend Code"}
          </button>
        )}

        {onBack && (
          <button
            onClick={onBack}
            className="btn-link"
          >
            Change Phone Number
          </button>
        )}
      </div>
    </div>
  );
};

export default Otp;