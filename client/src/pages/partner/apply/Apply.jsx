import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { ApplySteps, DemoNote } from "@/components/partner/PartnerBits";
import { notify } from "@/lib/notify";
import { ZONES } from "@/lib/partnerDemoData";

const INPUT = "mt-1.5 h-12 w-full rounded-xl border border-border bg-white px-3 text-base font-normal outline-none focus:border-primary";
const VEHICLES = ["Bike", "Scooter", "EV", "Cycle"];

const Apply = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", zone: ZONES[0], vehicle: "Bike", number: "" });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const isCycle = form.vehicle === "Cycle";

  const submit = (event) => {
    event.preventDefault();
    if (!/^[6-9]\d{9}$/.test(form.phone)) return notify.error("Enter a 10-digit mobile number");
    if (!isCycle && form.number.trim().length < 6) return notify.error("Enter your vehicle number");
    navigate("/partner/apply/documents");
  };

  return (
    <MobileShell back="/partner/login" title="Become a partner" subtitle="Step 1 of 3 · about 5 minutes">
      <ApplySteps current={1} />
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold">
          Full name (as on Aadhaar)
          <input required value={form.name} onChange={set("name")} className={INPUT} />
        </label>
        <label className="block text-sm font-semibold">
          Mobile number
          <input type="tel" inputMode="numeric" maxLength={10} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))} placeholder="98765 43210" className={INPUT} />
        </label>
        <label className="block text-sm font-semibold">
          Preferred zone
          <select value={form.zone} onChange={set("zone")} className={INPUT}>
            {ZONES.map((z) => <option key={z}>{z}</option>)}
          </select>
        </label>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">Vehicle type</legend>
          <div className="grid grid-cols-4 gap-2">
            {VEHICLES.map((v) => (
              <label key={v} className={`flex h-11 cursor-pointer items-center justify-center rounded-xl border-[1.5px] text-sm font-semibold ${form.vehicle === v ? "border-primary bg-primary/5 text-primary" : "border-border bg-white"}`}>
                <input type="radio" name="vt" value={v} checked={form.vehicle === v} onChange={set("vehicle")} className="sr-only" />
                {v}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm font-semibold">
          Vehicle number
          <input disabled={isCycle} value={isCycle ? "" : form.number} onChange={set("number")} placeholder="PB 65 BK 7781" className={`${INPUT} disabled:bg-muted`} />
          {isCycle && <span className="mt-1 block text-xs font-normal text-muted-foreground">Not needed for cycles</span>}
        </label>

        <button type="submit" className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-white">Continue to documents</button>
      </form>
      <DemoNote>Applications aren't saved yet — there's no sign-up endpoint for partners.</DemoNote>
    </MobileShell>
  );
};

export default Apply;
