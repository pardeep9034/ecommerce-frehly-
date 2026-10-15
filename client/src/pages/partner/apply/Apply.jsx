import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { registerUser, resendOtp, signup, verifyOtp } from "@/apis/authApi";
import MobileShell from "@/components/partner/MobileShell";
import { ApplySteps, CodeInput } from "@/components/partner/PartnerBits";
import useDeliveryZone from "@/hooks/use-deliveryZone";
import usePartnerApplication from "@/hooks/use-partnerApplication";
import { notify } from "@/lib/notify";
import { setToken } from "@/lib/tokenStorage";

const INPUT = "mt-1.5 h-12 w-full rounded-xl border border-border bg-white px-3 text-base font-normal outline-none focus:border-primary disabled:bg-muted";
const VEHICLES = [["BIKE", "Bike"], ["SCOOTER", "Scooter"], ["EV_SCOOTER", "EV"], ["CYCLE", "Cycle"]];
const RESEND_SECONDS = 30;

const Apply = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { application, createMutation, loadMine } = usePartnerApplication();
  const { deliveryZonesData } = useDeliveryZone(1, 100);
  const zones = (deliveryZonesData?.data?.deliveryZones ?? []).filter((z) => z.is_active);

  // The invite text links here with the number staff entered (P3-9). The vehicle details are already on the application.
  const invitePhone = /^[6-9]\d{9}$/.test(params.get("phone") ?? "") ? params.get("phone") : "";
  const [invite, setInvite] = useState(Boolean(invitePhone));
  const [form, setForm] = useState({ name: "", phone: invitePhone, zone: "", vehicle: "BIKE", number: "", password: "" });
  const [step, setStep] = useState("details"); // details -> otp
  const [otp, setOtp] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  // OTP codes are single use and register can only run once, so a retry must skip what already succeeded.
  const [verified, setVerified] = useState(false);
  const [registered, setRegistered] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const isCycle = form.vehicle === "CYCLE";

  // Someone who already applied belongs on their application, not on a second sign-up.
  useEffect(() => {
    if (application) navigate(["DRAFT", "CHANGES_REQUESTED"].includes(application.status) ? "/partner/apply/documents" : "/partner/apply/status", { replace: true });
  }, [application, navigate]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  // Runs whichever of verify -> register -> create application has not succeeded yet.
  const finish = async () => {
    setBusy(true);
    let proven = verified;
    try {
      if (!verified) {
        const res = await verifyOtp({ phone: form.phone, otp, type: "SIGNUP" });
        // The 10-minute onboarding token authorises register and the application calls; the refresh cookie takes over after.
        setToken(res.data.onBoardToken);
        setVerified(true);
        proven = true;
      }
      if (!registered) {
        await registerUser({ phone: form.phone, first_name: form.name.trim(), password: form.password });
        setRegistered(true);
      }
      // Staff may have started this application already (invite link); take it instead of creating a second one (409).
      if (await loadMine()) return; // the effect above opens it
      if (invite) {
        // Nothing was started for this number, so the vehicle details we hid are needed after all.
        setInvite(false);
        setStep("details");
        return notify.error("Add your vehicle details to continue");
      }
      await createMutation.mutateAsync({
        name: form.name.trim(),
        vehicle_type: form.vehicle,
        ...(form.zone && { preferred_zone_id: Number(form.zone) }),
        ...(!isCycle && { vehicle_number: form.number.trim().toUpperCase() }),
      });
      // The effect above moves us to the documents page once the application is in the cache.
    } catch (error) {
      notify.apiError(error, "Could not finish sign-up");
      if (proven) setStep("details"); // the phone is proven; let them fix the details and continue
      else setOtp("");
    } finally {
      setBusy(false);
    }
  };

  const submitDetails = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) return notify.error("Enter your full name");
    if (!/^[6-9]\d{9}$/.test(form.phone)) return notify.error("Enter a 10-digit mobile number");
    if (!invite && !isCycle && form.number.trim().length < 4) return notify.error("Enter your vehicle number");
    if (!registered && form.password.length < 8) return notify.error("Password must be at least 8 characters");

    if (verified) return finish();
    setBusy(true);
    try {
      await signup({ phone: form.phone, role: "DELIVERY_PARTNER" });
      setOtp("");
      setSeconds(RESEND_SECONDS);
      setStep("otp");
    } catch (error) {
      notify.apiError(error, "Could not send the code");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await resendOtp(form.phone, "SIGNUP");
      setSeconds(RESEND_SECONDS);
    } catch (error) {
      notify.apiError(error, "Could not resend the code");
    }
  };

  if (step === "otp") {
    return (
      <MobileShell title="Verify your number" subtitle={`Code sent to +91 ${form.phone}`}>
        <ApplySteps current={1} />
        <CodeInput length={6} value={otp} onChange={setOtp} label="6-digit code" />
        <button type="button" disabled={otp.length !== 6 || busy} onClick={finish} className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-border disabled:text-muted-foreground">
          {busy ? "Please wait…" : "Verify and continue"}
        </button>
        <div className="flex justify-between text-sm font-semibold text-primary">
          <button type="button" onClick={() => setStep("details")}>Change number</button>
          <button type="button" disabled={seconds > 0} onClick={resend} className="disabled:text-muted-foreground">
            {seconds > 0 ? `Resend in ${seconds}s` : "Resend code"}
          </button>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell back="/partner/login" title="Become a partner" subtitle="Step 1 of 3 · about 5 minutes">
      <ApplySteps current={1} />
      <form onSubmit={submitDetails} className="space-y-4">
        <label className="block text-sm font-semibold">
          Full name (as on Aadhaar)
          <input required maxLength={50} value={form.name} onChange={set("name")} className={INPUT} />
        </label>
        <label className="block text-sm font-semibold">
          Mobile number
          <input type="tel" inputMode="numeric" maxLength={10} disabled={verified || invite} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))} placeholder="98765 43210" className={INPUT} />
        </label>
        <label className="block text-sm font-semibold">
          Password
          <input type="password" autoComplete="new-password" disabled={registered} value={form.password} onChange={set("password")} placeholder="At least 8 characters" className={INPUT} />
        </label>
        {invite ? (
          <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">Freshly has already started your application with your vehicle details. Verify your number and set a password to continue.</p>
        ) : (
          <>
            <label className="block text-sm font-semibold">
              Preferred zone
              <select value={form.zone} onChange={set("zone")} className={INPUT}>
                <option value="">No preference</option>
                {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </label>

            <fieldset>
              <legend className="mb-1.5 text-sm font-semibold">Vehicle type</legend>
              <div className="grid grid-cols-4 gap-2">
                {VEHICLES.map(([value, label]) => (
                  <label key={value} className={`flex h-11 cursor-pointer items-center justify-center rounded-xl border-[1.5px] text-sm font-semibold ${form.vehicle === value ? "border-primary bg-primary/5 text-primary" : "border-border bg-white"}`}>
                    <input type="radio" name="vt" value={value} checked={form.vehicle === value} onChange={set("vehicle")} className="sr-only" />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block text-sm font-semibold">
              Vehicle number
              <input disabled={isCycle} maxLength={20} value={isCycle ? "" : form.number} onChange={set("number")} placeholder="PB 65 BK 7781" className={`${INPUT} uppercase`} />
              {isCycle && <span className="mt-1 block text-xs font-normal text-muted-foreground">Not needed for cycles</span>}
            </label>
          </>
        )}

        <button type="submit" disabled={busy} className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-60">
          {busy ? "Please wait…" : verified ? "Continue to documents" : "Send verification code"}
        </button>
      </form>
    </MobileShell>
  );
};

export default Apply;
