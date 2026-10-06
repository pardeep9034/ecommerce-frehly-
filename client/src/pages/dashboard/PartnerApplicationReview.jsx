import { FileImage } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "@/components/dashboard/PageHeader";
import { Avatar, Card, DemoNote, StatusPill } from "@/components/partner/PartnerBits";
import { notify } from "@/lib/notify";
import { APPLICATIONS, REVIEW_CHECKS, REVIEW_DOCS, ZONES } from "@/lib/partnerDemoData";

const FIELD = "h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary";

const PartnerApplicationReview = () => {
  const { applicationId } = useParams();
  const app = APPLICATIONS.find((a) => a.id === applicationId) || APPLICATIONS[0];

  const [docs, setDocs] = useState(REVIEW_DOCS);
  const [docKey, setDocKey] = useState("rc");
  const [checks, setChecks] = useState(() => Object.fromEntries(REVIEW_CHECKS.map((c) => [c.key, !!c.done])));
  const [note, setNote] = useState("");

  const doc = docs.find((d) => d.key === docKey);
  const setDocStatus = (status) => setDocs((list) => list.map((d) => (d.key === docKey ? { ...d, status } : d)));
  const done = REVIEW_CHECKS.filter((c) => checks[c.key]).length;
  const ready = done === REVIEW_CHECKS.length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Review application"
        description="Check documents and the screening list, then activate the partner."
        backTo="/dashboard/delivery-partners"
        backLabel="Applications"
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card className="flex items-center gap-4">
            <Avatar initials={app.initials} className="h-14 w-14 text-lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-semibold text-foreground">{app.name}</h2>
                <StatusPill status={app.status} />
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {app.source === "Self" ? "Self sign-up" : app.source}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {app.phone} (OTP verified) · {app.zone} · {app.vehicle} · applied {app.submitted}
              </p>
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 font-display text-base font-semibold text-foreground">Documents</h3>
            <div className="flex flex-wrap gap-2">
              {docs.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  aria-current={d.key === docKey}
                  onClick={() => setDocKey(d.key)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm ${
                    d.key === docKey ? "border-primary bg-primary/5" : "border-border bg-white hover:bg-muted"
                  }`}
                >
                  <span className="font-medium text-foreground">{d.label}</span>
                  <StatusPill status={d.status} />
                </button>
              ))}
            </div>

            <h3 className="mb-2 mt-5 text-sm font-semibold text-foreground">{doc.label}</h3>
            <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted text-muted-foreground">
              <FileImage className="h-8 w-8" />
              <span className="text-sm">{doc.status === "Not uploaded" ? "Nothing uploaded yet" : "[Uploaded document image]"}</span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Entered by applicant</dt>
                <dd className="font-medium text-foreground">PB 65 BK 7781</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Owner name on RC</dt>
                <dd className="font-medium text-muted-foreground">[Read from document]</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Uploaded</dt>
                <dd className="font-medium text-foreground">24 Sep, 10:09 AM</dd>
              </div>
            </dl>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => notify.notWired("Asking the applicant to re-upload")}
                className="h-9 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted"
              >
                Ask to re-upload
              </button>
              <button
                type="button"
                disabled={doc.status === "Not uploaded"}
                onClick={() => setDocStatus("Verified")}
                className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-border disabled:text-muted-foreground"
              >
                Mark verified
              </button>
            </div>
          </Card>
        </div>

        <Card className="space-y-4 self-start">
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">Screening checklist</h2>
            <p className="text-xs text-muted-foreground">
              {done} of {REVIEW_CHECKS.length} checks done {ready ? "— ready to approve" : "— approve unlocks when all are ticked"}
            </p>
          </div>
          <ul className="space-y-2">
            {REVIEW_CHECKS.map((c) => (
              <li key={c.key}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={checks[c.key]}
                    onChange={() => setChecks((v) => ({ ...v, [c.key]: !v[c.key] }))}
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <span>
                    <span className="block text-sm font-medium text-foreground">{c.label}</span>
                    <span className="block text-xs text-muted-foreground">{c.sub}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">On approval</p>
            <label className="block text-sm font-medium">
              Zone
              <select className={`${FIELD} mt-1`} defaultValue={app.zone}>
                {ZONES.map((z) => <option key={z}>{z}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Max active orders
              <select className={`${FIELD} mt-1`} defaultValue="3">
                {[2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Note for the record
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="DL still missing — ask before approving."
                className="mt-1 w-full rounded-lg border border-border bg-white p-3 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              disabled={!ready}
              onClick={() => notify.notWired("Approving partners")}
              className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-border disabled:text-muted-foreground"
            >
              Approve &amp; activate
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => notify.notWired("Requesting changes")} className="h-10 rounded-lg border border-border text-sm font-semibold hover:bg-muted">
                Request changes
              </button>
              <button type="button" onClick={() => notify.notWired("Rejecting applications")} className="h-10 rounded-lg border border-destructive/30 text-sm font-semibold text-destructive hover:bg-destructive/5">
                Reject
              </button>
            </div>
          </div>
        </Card>
      </div>
      <DemoNote>Application details, documents and the checklist are demo data — nothing here is saved yet.</DemoNote>
    </div>
  );
};

export default PartnerApplicationReview;
