import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OtpPage from "@/components/freshly/OtpPage";
import { loginWithPassword, signup, registerUser } from "@/apis/authApi";
import { getUserCart } from "@/apis/cartApi";
import { loginSuccess } from "@/redux/authSlice";
import { setCart } from "@/redux/cartSlice";
import { setToken, clearToken } from "@/lib/tokenStorage";

const INPUT =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10";
const PRIMARY =
  "flex h-12 w-full items-center justify-center rounded-2xl bg-primary px-6 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-primary/90 disabled:opacity-60";
const ERROR = "rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700";
const PHONE = /^\d{10}$/;

const message = (err, fallback) => err?.response?.data?.message || fallback;

const PasswordInput = ({ value, onChange, autoComplete, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-label="Password"
        className={`${INPUT} pr-12`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};

// Log in or sign up without leaving the page (cart checkout). Calls onSignedIn once the customer has an access token.
const AuthDialog = ({ open, onOpenChange, onSignedIn }) => {
  const dispatch = useDispatch();
  // the cart on screen; localStorage "cart" is already wiped by the signed-out logout() at app start
  const cartItems = useSelector((state) => state.cart.items);
  const [tab, setTab] = useState("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [login, setLogin] = useState({ phone: "", password: "" });
  // signup: "phone" -> "otp" -> "details"
  const [signupStep, setSignupStep] = useState("phone");
  const [signupPhone, setSignupPhone] = useState("");
  const [details, setDetails] = useState({ first_name: "", last_name: "", email: "", password: "" });

  const reset = () => {
    setTab("login");
    setError("");
    setLogin({ phone: "", password: "" });
    setSignupStep("phone");
    setSignupPhone("");
    setDetails({ first_name: "", last_name: "", email: "", password: "" });
  };

  const handleOpenChange = (next) => {
    if (!next) {
      // after the OTP step the onboarding token sits in storage; leaving half way must not look signed in
      if (signupStep === "details") clearToken();
      reset();
    }
    onOpenChange(next);
  };

  // Same as LoginPage: keep the token, then load the server cart (the guest cart is merged on login).
  const finish = async (identifier, password) => {
    const data = await loginWithPassword({ identifier, password, guest_cart: cartItems });
    const token = data.data.accessToken;
    setToken(token);
    dispatch(loginSuccess({ token }));
    const response = await getUserCart();
    dispatch(setCart(response.data.items));
    reset();
    onSignedIn();
  };

  const run = async (task, fallback) => {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (err) {
      setError(message(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  const submitLogin = (e) => {
    e.preventDefault();
    if (!PHONE.test(login.phone)) return setError("Enter your 10 digit phone number");
    if (!login.password) return setError("Enter your password");
    run(() => finish(login.phone, login.password), "Invalid phone number or password");
  };

  const submitPhone = (e) => {
    e.preventDefault();
    if (!PHONE.test(signupPhone)) return setError("Enter a valid 10 digit phone number");
    run(async () => {
      await signup({ phone: signupPhone });
      setSignupStep("otp");
    }, "Could not send the code. Try again.");
  };

  const submitDetails = (e) => {
    e.preventDefault();
    if (!details.first_name.trim() || !details.last_name.trim()) return setError("Enter your first and last name");
    if (!/^\S+@\S+\.\S+$/.test(details.email)) return setError("Enter a valid email");
    if (details.password.length < 8) return setError("Password must be at least 8 characters");
    run(async () => {
      await registerUser({ phone: signupPhone, ...details });
      // register returns no access token, so log in with the new password
      await finish(signupPhone, details.password);
    }, "Could not create your account. Try again.");
  };

  const field = (setter, key) => (e) => {
    setter((prev) => ({ ...prev, [key]: e.target.value }));
    setError("");
  };
  const digits = (setter) => (e) => {
    setter(e.target.value.replace(/\D/g, "").slice(0, 10));
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle>Log in to checkout</DialogTitle>
          <DialogDescription>Your cart stays as it is.</DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(value) => {
            setTab(value);
            setError("");
          }}
        >
          <TabsList className="grid w-full grid-cols-2 rounded-2xl">
            <TabsTrigger value="login" disabled={signupStep === "details"} className="rounded-xl font-bold">
              Log in
            </TabsTrigger>
            <TabsTrigger value="signup" className="rounded-xl font-bold">
              Sign up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={submitLogin} className="space-y-3 pt-2">
              {error && <p className={ERROR}>{error}</p>}
              <input
                type="tel"
                inputMode="numeric"
                value={login.phone}
                onChange={digits((phone) => setLogin((prev) => ({ ...prev, phone })))}
                placeholder="Phone number"
                autoComplete="tel"
                aria-label="Phone number"
                className={INPUT}
              />
              <PasswordInput
                value={login.password}
                onChange={field(setLogin, "password")}
                placeholder="Password"
                autoComplete="current-password"
              />
              <Link
                to="/forgot-password"
                className="block text-right text-xs font-bold text-primary hover:underline"
              >
                Forgot password?
              </Link>
              <button type="submit" disabled={busy} className={PRIMARY}>
                {busy ? "Logging in..." : "Log in"}
              </button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <div className="space-y-3 pt-2">
              {error && <p className={ERROR}>{error}</p>}

              {signupStep === "phone" && (
                <form onSubmit={submitPhone} className="space-y-3">
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={signupPhone}
                    onChange={digits(setSignupPhone)}
                    placeholder="Phone number"
                    autoComplete="tel"
                    aria-label="Phone number"
                    className={INPUT}
                  />
                  <button type="submit" disabled={busy} className={PRIMARY}>
                    {busy ? "Sending code..." : "Send code"}
                  </button>
                </form>
              )}

              {signupStep === "otp" && (
                <div className="[&_.otp-card]:border-0 [&_.otp-card]:p-0 [&_.otp-card]:shadow-none">
                  <OtpPage
                    phone={signupPhone}
                    type="SIGNUP"
                    onSuccess={() => setSignupStep("details")}
                    onBack={() => setSignupStep("phone")}
                  />
                </div>
              )}

              {signupStep === "details" && (
                <form onSubmit={submitDetails} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={details.first_name}
                      onChange={field(setDetails, "first_name")}
                      placeholder="First name"
                      autoComplete="given-name"
                      aria-label="First name"
                      className={INPUT}
                    />
                    <input
                      value={details.last_name}
                      onChange={field(setDetails, "last_name")}
                      placeholder="Last name"
                      autoComplete="family-name"
                      aria-label="Last name"
                      className={INPUT}
                    />
                  </div>
                  <input
                    type="email"
                    value={details.email}
                    onChange={field(setDetails, "email")}
                    placeholder="Email"
                    autoComplete="email"
                    aria-label="Email"
                    className={INPUT}
                  />
                  <PasswordInput
                    value={details.password}
                    onChange={field(setDetails, "password")}
                    placeholder="Password (8+ characters)"
                    autoComplete="new-password"
                  />
                  <button type="submit" disabled={busy} className={PRIMARY}>
                    {busy ? "Creating account..." : "Create account"}
                  </button>
                </form>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
