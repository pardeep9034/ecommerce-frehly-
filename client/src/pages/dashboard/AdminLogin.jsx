import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { Leaf, LockKeyhole } from "lucide-react";
import { loginWithPassword } from "@/apis/authApi";
import { loginSuccess } from "@/redux/authSlice";
import { setToken } from "@/lib/tokenStorage";

const isValidPhoneNumber = (phone) => /^[+]?[1-9][\d]{0,15}$/.test(phone);
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const AdminLogin = () => {
  const dispatch = useDispatch();
  const [credentialIdentifier, setCredentialIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");

  const { mutate: signIn, isPending } = useMutation({
    mutationFn: loginWithPassword,
    onSuccess: (response) => {
      const accessToken = response?.data?.accessToken;

      if (!accessToken) {
        setError("The login response did not include an access token.");
        return;
      }

      setToken(accessToken, rememberMe);
      dispatch(loginSuccess({ token: accessToken, user: response?.data?.user }));
      window.location.replace("/admin");
    },
    onError: (requestError) => {
      setError(requestError?.response?.data?.message || "Invalid email/mobile number or password.");
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedIdentifier = credentialIdentifier.trim();
    const isEmail = isValidEmail(trimmedIdentifier);
    const normalizedPhone = trimmedIdentifier.replace(/[\s\-()]/g, "");

    if (!isEmail && !isValidPhoneNumber(normalizedPhone)) {
      setError("Enter a valid email or mobile number.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setError("");
    // Backend resolves this field by phone OR email (UserRepository.findByPhoneOrEmail),
    // so the wire key stays "phone" for compatibility with the storefront login too.
    signIn({ identifier: isEmail ? trimmedIdentifier : normalizedPhone, password, guest_cart: [], rememberMe });
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
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Admin</span>
          </div>

          <div>
            <h1 className="max-w-sm text-4xl font-bold leading-tight">Every store, order and rider in one place.</h1>
            <p className="mt-5 max-w-sm text-base leading-7 text-white/75">
              For super admins. Store admins and ops staff sign in here too.
            </p>
          </div>

          <p className="text-sm text-white/55">Freshly Store Management</p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="mb-9 lg:hidden">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
                <Leaf className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-warning">Admin Portal</p>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign in</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Use your admin email or mobile number.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              {error && (
                <p role="alert" className="rounded-xl border border-destructive bg-destructive px-4 py-3 font-bold text-sm text-accent-foreground">
                  {error}
                </p>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-foreground">Email or mobile</span>
                <input
                  type="text"
                  value={credentialIdentifier}
                  onChange={(event) => setCredentialIdentifier(event.target.value)}
                  placeholder="you@freshly.in or mobile number"
                  autoComplete="username"
                  className="w-full rounded-xl border border-border bg-card px-3 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </label>

              <label className="block">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Password</span>
                  <a href="/forgot-password" className="text-sm font-semibold text-primary hover:text-primary/80">
                    Forgot password?
                  </a>
                </div>
                <span className="flex items-center overflow-hidden rounded-xl border border-primary bg-card">
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
                disabled={isPending}
                className="w-full rounded-xl bg-primary mt-3 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_22px_-14px_hsl(var(--primary)/0.95)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? "Signing in..." : "Sign in"}
              </button>

              <p className="flex gap-2 rounded-xl bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                <span>5 incorrect attempts will lock this account for 15 minutes.</span>
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminLogin;
