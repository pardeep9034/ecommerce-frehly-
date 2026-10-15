import { Info } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/dashboard/PageHeader";
import { Card } from "@/components/partner/PartnerBits";
import useDeliveryZone from "@/hooks/use-deliveryZone";
import { useCreateOnBehalf } from "@/hooks/use-partnerReview";
import { notify } from "@/lib/notify";
import { VEHICLE_LABEL } from "@/lib/partnerReview";

const INPUT = "mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary";

// "+91 97800 00098", "097800 00098" and "9780000098" all become the 10 digits the server wants.
const tenDigits = (raw) => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits.slice(0, 10);
};
const MOBILE = /^[6-9]\d{9}$/;
const spaced = (phone) => `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;

const Field = ({ label, error, children }) => (
  <label className="block text-sm font-medium text-foreground">
    {label}
    {children}
    {error && <span className="mt-1 block text-xs font-normal text-destructive">{error}</span>}
  </label>
);

const AddDeliveryPartner = () => {
  const navigate = useNavigate();
  const create = useCreateOnBehalf();
  const { deliveryZonesData } = useDeliveryZone(1, 100);
  const zones = (deliveryZonesData?.data?.deliveryZones ?? []).filter((z) => z.is_active !== false);

  const [form, setForm] = useState({ name: "", phone: "", email: "", vehicle_type: "BIKE", vehicle_number: "", zone: "" });
  const [touched, setTouched] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: key === "phone" ? tenDigits(e.target.value) : e.target.value }));

  const cycle = form.vehicle_type === "CYCLE";
  const errors = {
    name: form.name.trim().length < 2 ? "Enter the partner's name" : "",
    phone: MOBILE.test(form.phone) ? "" : "Enter a 10-digit mobile number",
    vehicle_number: !cycle && form.vehicle_number.trim().length < 4 ? "Enter the vehicle number" : "",
  };
  const invalid = Object.values(errors).some(Boolean);

  const submit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (invalid) return;
    create.mutate(
      {
        phone: form.phone,
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        vehicle_type: form.vehicle_type,
        vehicle_number: cycle ? undefined : form.vehicle_number.trim(),
        preferred_zone_id: form.zone ? Number(form.zone) : undefined,
      },
      {
        onSuccess: (draft) => {
          if (draft.invite_sent) notify.success(`Invite sent to ${spaced(draft.phone)}. Now add their documents.`);
          // Someone with a working account needs no sign-up link; they just have to log in to the partner app.
          else notify.info(`${spaced(draft.phone)} already has an account, so no invite was sent. Ask them to log in to the partner app.`);
          navigate(`/dashboard/delivery-partners/applications/${draft.id}`);
        },
        onError: (error) => notify.apiError(error),
      }
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Add delivery partner"
        description="Start an application on the partner's behalf. It still goes through review."
        backTo="/dashboard/delivery-partners"
        backLabel="Delivery partners"
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <form onSubmit={submit} noValidate className="space-y-5">
          <Card className="space-y-4">
            <h2 className="font-display text-base font-semibold text-foreground">Personal details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={touched && errors.name}>
                <input value={form.name} onChange={set("name")} maxLength={50} autoComplete="off" className={INPUT} />
              </Field>
              <Field label="Mobile number" error={touched && errors.phone}>
                <input value={form.phone} onChange={set("phone")} type="tel" inputMode="numeric" placeholder="97800 00098" autoComplete="off" className={INPUT} />
                {MOBILE.test(form.phone) && <span className="mt-1 block text-xs font-normal text-muted-foreground">We will text {spaced(form.phone)}</span>}
              </Field>
              <Field label="Email (optional)">
                <input value={form.email} onChange={set("email")} type="email" maxLength={150} className={INPUT} />
              </Field>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="font-display text-base font-semibold text-foreground">Vehicle &amp; zone</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Vehicle type">
                <select value={form.vehicle_type} onChange={set("vehicle_type")} className={INPUT}>
                  {Object.entries(VEHICLE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              {!cycle && (
                <Field label="Vehicle number" error={touched && errors.vehicle_number}>
                  <input value={form.vehicle_number} onChange={set("vehicle_number")} maxLength={20} placeholder="PB 70 C 1203" autoComplete="off" className={INPUT} />
                </Field>
              )}
              <Field label="Preferred zone (optional)">
                <select value={form.zone} onChange={set("zone")} className={INPUT}>
                  <option value="">No preference</option>
                  {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </Field>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Link to="/dashboard/delivery-partners" className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={create.isPending}
              className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {create.isPending ? "Creating…" : "Create draft & send invite"}
            </button>
          </div>
        </form>

        <aside className="space-y-5 self-start">
          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-foreground">
              <Info className="h-4 w-4 text-info" /> What happens next
            </h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>The partner gets a text with a link to sign up on their phone.</li>
              <li>You add the documents they gave you and submit, saying they agreed to the terms.</li>
              <li>The application joins the review queue marked <b className="text-foreground">Admin · you</b>.</li>
              <li>Someone else runs the checks and approves. It cannot be approved before the partner has signed in.</li>
            </ol>
          </Card>
          <Card className="bg-primary/5">
            <p className="text-sm font-semibold text-foreground">Same rules for everyone</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Adding a partner here does not skip verification. Only the review screen can activate an account.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default AddDeliveryPartner;
