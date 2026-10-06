import { FileText, Info } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/dashboard/PageHeader";
import { Card, DemoNote } from "@/components/partner/PartnerBits";
import { notify } from "@/lib/notify";
import { ZONES } from "@/lib/partnerDemoData";

const INPUT = "mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary";
const DOCS = [
  { key: "aadhaar", label: "Aadhaar card" },
  { key: "dl", label: "Driving licence" },
  { key: "rc", label: "Vehicle RC" },
  { key: "photo", label: "Profile photo" },
];
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const Field = ({ label, children }) => (
  <label className="block text-sm font-medium text-foreground">
    {label}
    {children}
  </label>
);

const AddDeliveryPartner = () => {
  const [files, setFiles] = useState({});

  const pickFile = (key, file) => {
    if (file && file.size > MAX_FILE_BYTES) {
      notify.error("Files must be 5 MB or smaller");
      return;
    }
    setFiles((f) => ({ ...f, [key]: file?.name }));
  };

  const submit = (event) => {
    event.preventDefault();
    notify.notWired("Creating partners");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Add delivery partner"
        description="Create an application on the partner's behalf. It still goes through review."
        backTo="/dashboard/delivery-partners"
        backLabel="Delivery partners"
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <form onSubmit={submit} className="space-y-5">
          <Card className="space-y-4">
            <h2 className="font-display text-base font-semibold text-foreground">Personal details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <input name="name" required className={INPUT} />
              </Field>
              <Field label="Mobile number">
                <input name="phone" type="tel" required pattern="(\+91)?[ ]?[6-9][0-9 ]{9,11}" title="10-digit Indian mobile number" placeholder="+91 97800 00098" className={INPUT} />
              </Field>
              <Field label="Email (optional)">
                <input name="email" type="email" className={INPUT} />
              </Field>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="font-display text-base font-semibold text-foreground">Vehicle &amp; zone</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Vehicle type">
                <select name="vehicle_type" className={INPUT}>
                  {["Bike", "Scooter", "EV scooter", "Cycle"].map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="Vehicle number">
                <input name="vehicle_number" placeholder="PB 70 C 1203" className={INPUT} />
              </Field>
              <Field label="Zone">
                <select name="zone" className={INPUT}>
                  {ZONES.map((z) => <option key={z}>{z}</option>)}
                </select>
              </Field>
              <Field label="Max active orders">
                <select name="max_active_orders" defaultValue="3" className={INPUT}>
                  {[2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}
                </select>
              </Field>
            </div>
          </Card>

          <Card className="space-y-3">
            <h2 className="font-display text-base font-semibold text-foreground">Documents</h2>
            <p className="text-xs text-muted-foreground">Photos or PDF, max 5 MB each. Missing ones can be added later.</p>
            {DOCS.map((d) => (
              <label key={d.key} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted">
                <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium text-foreground">{d.label}</span>
                <span className="truncate text-xs text-muted-foreground">{files[d.key] || ""}</span>
                <span className="text-sm font-semibold text-primary">{files[d.key] ? "Replace" : "Choose file"}</span>
                <input type="file" accept="image/*,.pdf" className="sr-only" onChange={(e) => pickFile(d.key, e.target.files[0])} />
              </label>
            ))}
          </Card>

          <div className="flex justify-end gap-3">
            <Link to="/dashboard/delivery-partners" className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted">
              Cancel
            </Link>
            <button type="submit" className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90">
              Create &amp; send to review
            </button>
          </div>
        </form>

        <aside className="space-y-5 self-start">
          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-foreground">
              <Info className="h-4 w-4 text-info" /> What happens next
            </h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>The partner gets an SMS to log in and finish any missing documents.</li>
              <li>The application joins the review queue marked <b className="text-foreground">Admin · you</b>.</li>
              <li>An admin runs the same screening checklist before activating.</li>
            </ol>
          </Card>
          <Card className="bg-primary/5">
            <p className="text-sm font-semibold text-foreground">Same rules for everyone</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Adding a partner here does not skip verification. Only the review screen can activate an account.
            </p>
          </Card>
          <DemoNote>The form isn't saved yet — there's no application endpoint.</DemoNote>
        </aside>
      </div>
    </div>
  );
};

export default AddDeliveryPartner;
