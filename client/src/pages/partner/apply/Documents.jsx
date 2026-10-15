import { Check, FileText, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { ApplySteps } from "@/components/partner/PartnerBits";
import useDeliveryZone from "@/hooks/use-deliveryZone";
import usePartnerApplication from "@/hooks/use-partnerApplication";
import { notify } from "@/lib/notify";
import { VEHICLE_LABEL } from "@/lib/partnerReview";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const INPUT = "mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-normal outline-none focus:border-primary";

// `number` / `expiry`: what the applicant types with the file. Aadhaar and licence need theirs before the first upload.
const DOC_INFO = {
  PHOTO: { label: "Profile photo", hint: "Clear face photo" },
  AADHAAR: { label: "Aadhaar card", hint: "Front side", number: "Aadhaar number (12 digits)", needsNumber: true },
  DL: { label: "Driving licence", hint: "Must cover two-wheeler", number: "Licence number", needsNumber: true, expiry: true },
  RC: { label: "Vehicle RC", hint: "Registration certificate" },
  PAN: { label: "PAN card", hint: "Optional", number: "PAN number" },
};

// The applicant's own details, editable until review starts (P2-5: the vehicle type is fixed once they have applied, so it is only shown).
// Anything the reviewer asked to have fixed is outlined.
const DetailsCard = ({ application, updateMutation, flagged }) => {
  const { deliveryZonesData } = useDeliveryZone(1, 100);
  const zones = (deliveryZonesData?.data?.deliveryZones ?? []).filter((z) => z.is_active);
  const isCycle = application.vehicle_type === "CYCLE";
  const initial = {
    name: application.name ?? "",
    email: application.email ?? "",
    zone: application.preferred_zone_id ? String(application.preferred_zone_id) : "",
    number: application.vehicle_number ?? "",
  };
  const [form, setForm] = useState(initial);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Only what changed goes to the server. A zone cannot be cleared once chosen, so a blank zone is never sent.
  const changed = {
    ...(form.name.trim() !== initial.name && { name: form.name.trim() }),
    ...(form.email.trim() !== initial.email && { email: form.email.trim() }),
    ...(form.zone && form.zone !== initial.zone && { preferred_zone_id: Number(form.zone) }),
    ...(!isCycle && form.number.trim().toUpperCase() !== initial.number && { vehicle_number: form.number.trim().toUpperCase() }),
  };
  const valid = form.name.trim().length >= 2 && (isCycle || form.number.trim().length >= 4);
  const save = () =>
    updateMutation.mutate(changed, {
      onSuccess: () => notify.success("Details saved"),
      onError: (error) => notify.apiError(error, "Could not save your details"),
    });

  const flag = (item) => (flagged.includes(item) ? "border-amber ring-1 ring-amber" : "");
  const hint = (item) => flagged.includes(item) && <span className="mt-1 block text-xs font-normal text-amber">The reviewer asked you to check this</span>;

  return (
    <section className="space-y-3 rounded-xl border border-border bg-white p-3 shadow-card">
      <h2 className="text-sm font-semibold text-foreground">Your details</h2>
      <label className="block text-xs font-semibold">
        Full name (as on Aadhaar)
        <input value={form.name} onChange={set("name")} maxLength={50} className={`${INPUT} ${flag("name")}`} />
        {hint("name")}
      </label>
      <label className="block text-xs font-semibold">
        Email (optional)
        <input type="email" value={form.email} onChange={set("email")} maxLength={150} className={`${INPUT} ${flag("email")}`} />
        {hint("email")}
      </label>
      <label className="block text-xs font-semibold">
        Preferred zone
        <select value={form.zone} onChange={set("zone")} className={`${INPUT} ${flag("preferred_zone_id")}`}>
          {!initial.zone && <option value="">No preference</option>}
          {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
        {hint("preferred_zone_id")}
      </label>
      <p className="text-xs font-semibold">
        Vehicle type
        <span className="mt-1 block text-sm font-normal text-muted-foreground">{VEHICLE_LABEL[application.vehicle_type]}</span>
      </p>
      {!isCycle && (
        <label className="block text-xs font-semibold">
          Vehicle number
          <input value={form.number} onChange={set("number")} maxLength={20} className={`${INPUT} uppercase ${flag("vehicle_number")}`} />
          {hint("vehicle_number")}
        </label>
      )}
      <button
        type="button"
        disabled={updateMutation.isPending || !valid || Object.keys(changed).length === 0}
        onClick={save}
        className="h-10 w-full rounded-lg border border-primary text-sm font-semibold text-primary disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground"
      >
        {updateMutation.isPending ? "Saving…" : "Save details"}
      </button>
    </section>
  );
};

const Documents = () => {
  const navigate = useNavigate();
  const { application, isLoading, uploadMutation, updateMutation, submitMutation, resubmitMutation } = usePartnerApplication();
  const [fields, setFields] = useState({}); // { DL: { number, expiry } }
  const [agreed, setAgreed] = useState(false);

  const editable = ["DRAFT", "CHANGES_REQUESTED"].includes(application?.status);
  useEffect(() => {
    if (isLoading) return;
    if (!application) navigate("/partner/apply", { replace: true });
    else if (!editable) navigate("/partner/apply/status", { replace: true });
  }, [application, isLoading, editable, navigate]);

  if (!application || !editable) return <MobileShell title="Upload documents"><p className="text-sm text-muted-foreground">Loading…</p></MobileShell>;

  const uploaded = Object.fromEntries(application.documents.map((d) => [d.type, d]));
  const change = (type, key) => (e) => setFields((f) => ({ ...f, [type]: { ...f[type], [key]: e.target.value } }));
  const missing = application.required_docs.filter((type) => !uploaded[type]);
  // Only required documents hold up the resubmit (P2-10); a sent-back PAN stays on record and blocks nothing.
  const rejected = application.documents.filter((d) => d.status === "REJECTED" && application.required_docs.includes(d.type));
  const changesRequested = application.status === "CHANGES_REQUESTED";
  // What the reviewer asked to have fixed: documents are marked below, applicant details are outlined in "Your details".
  const flagged = (changesRequested && application.events.findLast((e) => e.type === "CHANGES_REQUESTED")?.payload?.items) || [];

  const pick = (type, file) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) return notify.error("Files must be 5 MB or smaller");
    const info = DOC_INFO[type];
    const { number, expiry } = fields[type] ?? {};
    const doc = uploaded[type];
    if (info.needsNumber && !number && !doc?.number_masked) return notify.error(`Enter the ${info.label.toLowerCase()} number first`);
    if (info.expiry && !expiry && !doc?.expiry_date) return notify.error("Enter the licence expiry date first");
    uploadMutation.mutate(
      { type, file, number: number?.trim() || undefined, expiry_date: expiry || undefined },
      {
        onSuccess: () => setFields((f) => ({ ...f, [type]: undefined })),
        onError: (error) => notify.apiError(error, "Upload failed"),
      }
    );
  };

  const finish = () => {
    const mutation = changesRequested ? resubmitMutation : submitMutation;
    // On success the cached application is no longer editable and the effect above moves us to the status page.
    mutation.mutate(undefined, { onError: (error) => notify.apiError(error, "Could not submit your application") });
  };
  const submitting = submitMutation.isPending || resubmitMutation.isPending;
  const blocked = missing.length > 0 || rejected.length > 0 || (!changesRequested && !agreed);

  return (
    <MobileShell title="Upload documents" subtitle={`${application.ref} · photos or PDF, max 5 MB`}>
      <ApplySteps current={2} />
      {changesRequested && <p className="rounded-xl border border-amber/30 bg-amber/5 p-3 text-sm text-foreground">We need a few changes. Fix what is marked below, then resubmit.</p>}
      <DetailsCard application={application} updateMutation={updateMutation} flagged={flagged} />
      <ul className="space-y-2.5">
        {[...application.required_docs, ...application.optional_docs].map((type) => {
          const info = DOC_INFO[type];
          const doc = uploaded[type];
          const busy = uploadMutation.isPending && uploadMutation.variables.type === type;
          const bad = doc?.status === "REJECTED";
          return (
            <li key={type} className={`space-y-2 rounded-xl border bg-white p-3 shadow-card ${bad ? "border-destructive/40" : "border-border"}`}>
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bad ? "bg-destructive/10 text-destructive" : doc ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                  {bad ? <X className="h-5 w-5" /> : doc ? <Check className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{info.label}</span>
                  <span className={`block text-xs text-muted-foreground ${bad ? "" : "truncate"}`}>
                    {bad ? `Rejected: ${doc.reject_reason || "please upload a clearer copy"}` : doc ? [doc.status === "VERIFIED" ? "Verified" : "Uploaded", doc.number_masked, doc.expiry_date && `expires ${doc.expiry_date}`].filter(Boolean).join(" · ") : info.hint}
                  </span>
                </span>
              </div>

              {doc?.status !== "VERIFIED" && (
                <>
                  {info.number && (
                    <label className="block text-xs font-semibold">
                      {info.number}
                      <input value={fields[type]?.number ?? ""} onChange={change(type, "number")} maxLength={30} className={INPUT} />
                    </label>
                  )}
                  {info.expiry && (
                    <label className="block text-xs font-semibold">
                      Licence expiry date
                      <input type="date" min={new Date().toISOString().slice(0, 10)} value={fields[type]?.expiry ?? ""} onChange={change(type, "expiry")} className={INPUT} />
                    </label>
                  )}
                  <label className={`flex h-10 cursor-pointer items-center justify-center rounded-lg border border-primary text-sm font-semibold text-primary ${busy ? "opacity-60" : ""}`}>
                    {busy ? "Uploading…" : doc ? "Replace file" : "Choose file"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      disabled={uploadMutation.isPending}
                      className="sr-only"
                      onChange={(e) => { pick(type, e.target.files[0]); e.target.value = ""; }}
                    />
                  </label>
                </>
              )}
            </li>
          );
        })}
      </ul>

      {!changesRequested && (
        <label className="flex items-start gap-3 text-sm text-foreground">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
          I agree to identity and background verification by Freshly.
        </label>
      )}

      <button
        type="button"
        disabled={blocked || submitting}
        onClick={finish}
        className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-border disabled:text-muted-foreground"
      >
        {submitting ? "Please wait…" : changesRequested ? "Resubmit application" : "Submit application"}
      </button>
      {missing.length > 0 && <p className="text-center text-xs text-muted-foreground">Still needed: {missing.map((type) => DOC_INFO[type].label).join(", ")}</p>}
      {rejected.length > 0 && <p className="text-center text-xs text-muted-foreground">Replace: {rejected.map((d) => DOC_INFO[d.type].label).join(", ")}</p>}
    </MobileShell>
  );
};

export default Documents;
