import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { notify } from "@/lib/notify";
import { signInPartner } from "@/lib/partnerSession";

const Login = () => {
  const navigate = useNavigate();
  const { state } = useLocation(); // from forgot-password: { phone, reset: true } after a successful reset
  const [phone, setPhone] = useState(state?.phone ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const validPhone = /^[6-9]\d{9}$/.test(phone);
  const submit = async (event) => {
    event.preventDefault();
    if (!validPhone) return notify.error("Enter a 10-digit mobile number");
    if (!password) return notify.error("Enter your password");

    setBusy(true);
    try {
      const to = await signInPartner({ phone, password, home: "/partner/home" });
      if (!to) return notify.error("This number isn't registered as a delivery partner");
      navigate(to, { replace: true });
    } catch (error) {
      notify.apiError(error, "Could not sign in");
    } finally {
      setBusy(false);
    }
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
        <p className="mt-3 text-sm text-white/80">Sign in with your mobile number and password.</p>
        {state?.reset && (
          <p role="status" className="mt-4 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold">
            Password changed. Sign in with your new password.
          </p>
        )}

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

          <label className="block text-sm font-semibold">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 h-12 w-full rounded-lg border border-border bg-transparent px-3 text-base font-normal outline-none focus:border-primary"
            />
          </label>
          <Link to="/partner/forgot-password" state={{ phone }} className="-mt-2 block text-right text-xs font-semibold text-primary">
            Forgot password?
          </Link>

          <button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-60"
          >
            {busy ? "Please wait…" : "Sign in"}
          </button>
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
