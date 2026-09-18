import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { login } from "@/apis/authApi";
import RegisterModal from "./RegisterModal";
import "../../styles/loginPage.css";

const PHONE_PATTERN = /^\d{10}$/;

const PhoneLoginPage = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      const action = response?.data?.action;
      const phoneState = { state: { phone } };

      if (action === "LOGIN") {
        navigate("/login", phoneState);
        return;
      }

      if (action === "SIGNUP") {
        navigate("/signup", phoneState);
        return;
      }

      if (action === "COMPLETE_REGISTRATION") {
        setIsRegisterModalOpen(true);
        return;
      }

      setError(response?.message || "We could not determine the next step. Please try again.");
    },
    onError: (requestError) => {
      setError(requestError?.response?.data?.message || "Unable to continue. Please try again.");
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedPhone = phone.replace(/\D/g, "");

    if (!PHONE_PATTERN.test(normalizedPhone)) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }

    setError("");
    mutate({ phone: normalizedPhone });
  };

  return (
    <main className="login-container">
      <section className="login-card" aria-labelledby="phone-login-title">
        <header className="login-header">
          <h1 id="phone-login-title" className="login-title">Welcome</h1>
          <p className="login-subtitle">Enter your phone number to continue</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="general-error" role="alert">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="phone-login-number">Phone Number</label>
            <input
              id="phone-login-number"
              className={`form-input ${error ? "error" : ""}`}
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              pattern="[0-9]{10}"
              placeholder="Enter your 10-digit phone number"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));
                setError("");
              }}
              required
            />
          </div>

          <button className="login-btn login-btn-primary" type="submit" disabled={isPending}>
            {isPending ? "Checking..." : "Continue"}
          </button>

          <p className="signup-link">
            Already know your password? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </section>

      <RegisterModal
        open={isRegisterModalOpen}
        phone={phone}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => {
          setIsRegisterModalOpen(false);
          navigate("/login", { state: { phone } });
        }}
      />
    </main>
  );
};

export default PhoneLoginPage;
