import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, LockKeyhole } from "lucide-react";
import { signInPartner } from "@/lib/partnerSession";

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) return setError("Enter a 10-digit mobile number.");
    if (!password) return setError("Enter your password.");

    setError("");
    setBusy(true);
    try {
      const to = await signInPartner({ phone, password, remember: rememberMe, home: "/partner/web" });
      if (!to) return setError("This number isn't registered as a delivery partner.");
      navigate(to, { replace: true });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Invalid mobile number or password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted p-4 sm:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-5xl overflow-hidden rounded-3xl bg-card shadow-[0_24px_60px_-24px_hsl(var(--primary)/0.32)] lg:grid-cols-[1.05fr_0.95fr] sm:min-h-[calc(100vh-4rem)]">
        <section className="hidden flex-col justify-between bg-primary p-10 text-white lg:flex">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold tracking-tight">freshly</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Partner</span>
          </div>

          <div>
            <h1 className="max-w-sm text-4xl font-bold leading-tight">
              Deliver fresh.
              <br />
              <span className="text-accent">Right on time.</span>
            </h1>
            <p className="mt-5 max-w-sm text-base leading-7 text-white/75">
              Your orders, pickups and handovers for the day, on a bigger screen.
            </p>
          </div>

          <p className="text-sm text-white/55">Freshly Delivery Partners</p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="mb-9 lg:hidden">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
                <Leaf className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-warning">Partner Portal</p>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign in</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Use the mobile number and password you registered with.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              {error && (
                <p role="alert" className="rounded-xl border border-destructive bg-destructive px-4 py-3 font-bold text-sm text-accent-foreground">
                  {error}
                </p>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-foreground">Mobile number</span>
                <span className="flex items-center overflow-hidden rounded-xl border border-border bg-card focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
                  <span className="border-r border-border bg-muted px-3 py-3 text-sm text-muted-foreground">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
                    placeholder="98765 43210"
                    autoComplete="username"
                    className="w-full bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-foreground">Password</span>
                <span className="flex items-center overflow-hidden rounded-xl border border-border bg-card focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
                  <LockKeyhole className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="h-full shrink-0 border-l border-border bg-muted px-3 py-3 text-xs font-semibold text-muted-foreground transition hover:text-primary"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </span>
              </label>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-[18px] w-[18px] accent-primary"
                />
                Keep me signed in on this device
              </label>

              <button
                type="submit"
                disabled={busy}
                className="mt-3 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_22px_-14px_hsl(var(--primary)/0.95)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busy ? "Signing in..." : "Sign in"}
              </button>

              <p className="text-center text-sm text-muted-foreground">
                New to Freshly?{" "}
                <Link to="/partner/apply" className="font-semibold text-primary hover:text-primary/80">
                  Apply to become a partner
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
