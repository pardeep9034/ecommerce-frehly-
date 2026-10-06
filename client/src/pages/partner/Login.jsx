import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CodeInput, DemoNote } from "@/components/partner/PartnerBits";

const RESEND_SECONDS = 30;

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [left, setLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  const validPhone = /^[6-9]\d{9}$/.test(phone);
  const submit = (event) => {
    event.preventDefault();
    if (validPhone && otp.length === 6) navigate("/partner/home");
  };

  return (
    <div className="min-h-dvh bg-muted">
      <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col bg-primary px-6 py-8 text-white shadow-card">
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold">freshly</span>
          <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-accent-foreground">PARTNER</span>
        </div>
        <h1 className="mt-14 font-display text-4xl font-bold leading-tight">
          Deliver fresh.
          <br />
          <span className="text-accent">Right on time.</span>
        </h1>
        <p className="mt-3 text-sm text-white/80">Sign in with the mobile number registered with your store.</p>

        <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl bg-white p-5 text-foreground">
          <label className="block text-sm font-semibold">
            Mobile number
            <div className="mt-1.5 flex h-12 items-center rounded-lg border border-border focus-within:border-primary">
              <span className="border-r border-border px-3 text-sm text-muted-foreground">+91</span>
              <input
                id="partner-phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="98765 43210"
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none"
              />
            </div>
          </label>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm font-semibold">
              <span>Enter OTP</span>
              <button
                type="button"
                disabled={left > 0 || !validPhone}
                onClick={() => setLeft(RESEND_SECONDS)}
                className="text-xs font-medium text-muted-foreground enabled:text-primary"
              >
                {left > 0 ? `Resend in 00:${String(left).padStart(2, "0")}` : "Resend OTP"}
              </button>
            </div>
            <CodeInput length={6} value={otp} onChange={setOtp} label="OTP" />
          </div>

          <button
            type="submit"
            disabled={!validPhone || otp.length !== 6}
            className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-border disabled:text-muted-foreground"
          >
            Verify &amp; continue
          </button>
          <DemoNote>Demo sign-in — any 6 digits work. Partner OTP login isn't built yet.</DemoNote>
        </form>

        <p className="mt-auto pt-8 text-center text-sm text-white/80">
          New to Freshly?{" "}
          <Link to="/partner/apply" className="font-semibold text-accent underline-offset-4 hover:underline">
            Apply to become a partner
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
