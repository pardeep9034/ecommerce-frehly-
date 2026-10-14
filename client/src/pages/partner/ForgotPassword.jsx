import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword, verifyOtp } from "@/apis/authApi";
import MobileShell from "@/components/partner/MobileShell";
import { CodeInput } from "@/components/partner/PartnerBits";
import { notify } from "@/lib/notify";

const INPUT = "mt-1.5 h-12 w-full rounded-xl border border-border bg-white px-3 text-base font-normal outline-none focus:border-primary";
const BUTTON = "h-12 w-full rounded-xl bg-primary text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-border disabled:text-muted-foreground";
const RESEND_SECONDS = 30; // the server sends nothing inside 30 s of the last code

const SUBTITLE = { phone: "Step 1 of 3 · your number", code: "Step 2 of 3 · the code", password: "Step 3 of 3 · new password" };

// Phone -> code -> new password. The reset token lives in state only, never in storage.
const ForgotPassword = () => {
  const navigate = useNavigate();
  const { state } = useLocation(); // the login passes the number it already had
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState(state?.phone ?? "");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  // First send and resend are the same call. The server answers the same way whether or not the number has an account.
  const sendCode = async (event) => {
    event?.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) return notify.error("Enter a 10-digit mobile number");
    setBusy(true);
    try {
      await forgotPassword(phone);
      setCode("");
      setSeconds(RESEND_SECONDS);
      setStep("code");
    } catch (error) {
      notify.apiError(error, "Could not send the code");
    } finally {
      setBusy(false);
    }
  };

  const checkCode = async () => {
    setBusy(true);
    try {
      const res = await verifyOtp({ phone, otp: code, type: "FORGOT_PASSWORD" });
      setResetToken(res.data.resetToken);
      setStep("password");
    } catch (error) {
      notify.apiError(error, "Could not check the code");
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (password.length < 8) return notify.error("Password must be at least 8 characters");
    if (password !== confirm) return notify.error("The two passwords don't match");
    setBusy(true);
    try {
      await resetPassword({ resetToken, newPassword: password });
      navigate("/partner/login", { replace: true, state: { phone, reset: true } });
    } catch (error) {
      notify.apiError(error, "Could not change the password");
      if (error.response?.status === 401) setStep("phone"); // the 10-minute reset token ran out: start again
    } finally {
      setBusy(false);
    }
  };

  return (
    <MobileShell back="/partner/login" title="Reset password" subtitle={SUBTITLE[step]}>
      {step === "phone" && (
        <form onSubmit={sendCode} className="space-y-5">
          <p className="text-sm text-muted-foreground">Enter the mobile number you signed up with. We'll text you a 6-digit code.</p>
          <label className="block text-sm font-semibold">
            Mobile number
            <div className="mt-1.5 flex h-12 items-center rounded-xl border border-border bg-white focus-within:border-primary">
              <span className="border-r border-border px-3 text-sm text-muted-foreground">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="98765 43210"
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-base font-normal outline-none"
              />
            </div>
          </label>
          <button type="submit" disabled={busy} className={BUTTON}>{busy ? "Please wait…" : "Send code"}</button>
        </form>
      )}

      {step === "code" && (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">If +91 {phone} has a partner account, we've sent a 6-digit code to it.</p>
          <CodeInput length={6} value={code} onChange={setCode} label="6-digit code" />
          <button type="button" disabled={code.length !== 6 || busy} onClick={checkCode} className={BUTTON}>
            {busy ? "Please wait…" : "Verify code"}
          </button>
          <div className="flex justify-between text-sm font-semibold text-primary">
            <button type="button" onClick={() => setStep("phone")}>Change number</button>
            <button type="button" disabled={seconds > 0 || busy} onClick={sendCode} className="disabled:text-muted-foreground">
              {seconds > 0 ? `Resend in ${seconds}s` : "Resend code"}
            </button>
          </div>
        </div>
      )}

      {step === "password" && (
        <form onSubmit={save} className="space-y-5">
          <label className="block text-sm font-semibold">
            New password
            <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className={INPUT} />
          </label>
          <label className="block text-sm font-semibold">
            Confirm new password
            <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={INPUT} />
          </label>
          <button type="submit" disabled={busy} className={BUTTON}>{busy ? "Please wait…" : "Change password"}</button>
        </form>
      )}
    </MobileShell>
  );
};

export default ForgotPassword;
