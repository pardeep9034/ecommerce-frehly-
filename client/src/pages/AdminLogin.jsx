import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { Eye, EyeOff, Leaf, LockKeyhole, Phone } from "lucide-react";
import { loginWithPassword } from "@/apis/authApi";
import { loginSuccess } from "@/redux/authSlice";

const isValidPhoneNumber = (phone) => /^[+]?[1-9][\d]{0,15}$/.test(phone);

const AdminLogin = () => {
  const dispatch = useDispatch();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const { mutate: signIn, isPending } = useMutation({
    mutationFn: loginWithPassword,
    onSuccess: (response) => {
      const accessToken = response?.data?.accessToken;

      if (!accessToken) {
        setError("The login response did not include an access token.");
        return;
      }

      localStorage.setItem("token", accessToken);
      dispatch(loginSuccess({ token: accessToken, user: response?.data?.user }));
      window.location.replace("/dashboard");
    },
    onError: (requestError) => {
      setError(requestError?.response?.data?.message || "Invalid phone number or password.");
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedPhone = phone.replace(/[\s\-()]/g, "");

    if (!isValidPhoneNumber(normalizedPhone)) {
      setError("Enter a valid phone number.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setError("");
    signIn({ phone: normalizedPhone, password, guest_cart: [] });
  };

  return (
    <main className="min-h-screen bg-[#f3f6f3] p-4 sm:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-5xl overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-24px_rgba(15,81,50,0.32)] lg:grid-cols-[1.05fr_0.95fr] sm:min-h-[calc(100vh-4rem)]">
        <section className="hidden flex-col justify-between bg-[#0f5132] p-10 text-white lg:flex">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#b8860b] shadow-lg">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold tracking-tight">Freshly</span>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#f7d984]">Admin Portal</p>
            <h1 className="max-w-sm text-4xl font-bold leading-tight">Run your store with clarity.</h1>
            <p className="mt-5 max-w-sm text-base leading-7 text-white/75">
              Manage products, inventory, promotions, and orders from one secure workspace.
            </p>
          </div>

          <p className="text-sm text-white/55">Freshly Store Management</p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="mb-9 lg:hidden">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f5132] text-white">
                <Leaf className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b8860b]">Admin Portal</p>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-[#1f2937]">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-[#6b7280]">Sign in to access the Freshly dashboard.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              {error && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#374151]">Phone number</span>
                <span className="flex items-center rounded-xl border border-[#d1d5db] bg-white px-3 transition focus-within:border-[#0f5132] focus-within:ring-4 focus-within:ring-[#0f5132]/10">
                  <Phone className="h-4 w-4 shrink-0 text-[#6b7280]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Enter your phone number"
                    autoComplete="tel"
                    className="w-full bg-transparent px-3 py-3 text-sm text-[#1f2937] outline-none placeholder:text-[#9ca3af]"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#374151]">Password</span>
                <span className="flex items-center rounded-xl border border-[#d1d5db] bg-white px-3 transition focus-within:border-[#0f5132] focus-within:ring-4 focus-within:ring-[#0f5132]/10">
                  <LockKeyhole className="h-4 w-4 shrink-0 text-[#6b7280]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full bg-transparent px-3 py-3 text-sm text-[#1f2937] outline-none placeholder:text-[#9ca3af]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="rounded-lg p-1 text-[#6b7280] transition hover:bg-[#f3f6f3] hover:text-[#0f5132]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-[#0f5132] mt-3 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_22px_-14px_rgba(15,81,50,0.95)] transition hover:bg-[#0b4128] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? "Signing in..." : "Sign in to dashboard"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminLogin;
