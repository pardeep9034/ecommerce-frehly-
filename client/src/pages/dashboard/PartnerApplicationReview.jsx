import { RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getProfile } from "@/apis/authApi";
import partnerReviewApi from "@/apis/partnerReviewApi";
import PageHeader from "@/components/dashboard/PageHeader";
import { Avatar, Card, StatusPill, Timeline } from "@/components/partner/PartnerBits";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import useDeliveryZone from "@/hooks/use-deliveryZone";
import usePartnerReview from "@/hooks/use-partnerReview";
import { notify } from "@/lib/notify";
import {
  APPLICATION_STATUS, DOC_LABEL, DOC_ORDER, DOC_STATUS, FIELD_LABEL, REASON_LABEL, SOURCE_LABEL, VEHICLE_LABEL, whenIST,
} from "@/lib/partnerReview";

const FIELD = "h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary";
const AREA = "mt-1 w-full rounded-lg border border-border bg-white p-3 text-sm outline-none focus:border-primary";
const GHOST = "h-9 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";
const SOLID = "h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-border disabled:text-muted-foreground";
const DECIDERS = ["ADMIN", "SUPER_ADMIN"];

const CHECK_INFO = {
  PHONE_OTP: ["Phone verified by OTP", "Done automatically at sign-up"],
  ID_MATCH: ["Name and photo match Aadhaar", "Compare profile photo with ID"],
  DL_VALID: ["Driving licence valid for two-wheeler", "Check expiry and vehicle class"],
  RC_MATCH: ["RC matches vehicle number", "Compare the plate on the RC with the one entered"],
  BG_CHECK: ["Background check cleared", "Police or third-party verification"],
  SAFETY_BRIEFING: ["Safety and app briefing done", "In person or on call"],
};

const EVENT_LABEL = {
  CREATED: "Application created", SUBMITTED: "Submitted", DOC_UPLOADED: "Document uploaded", DOC_VERIFIED: "Document verified",
  DOC_REJECTED: "Document sent back", CHECK_DONE: "Check done", CHECK_UNDONE: "Check undone", REVIEW_STARTED: "Review started",
  NOTE: "Note", CHANGES_REQUESTED: "Changes requested", RESUBMITTED: "Resubmitted", APPROVED: "Approved", REJECTED: "Rejected",
};

const initialsOf = (name) => (name || "?").split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
// No names in tokens yet (P2-4): "You" for the signed-in staff member, "Staff #12" for anyone else.
const actorLabel = (e, me) =>
  e.actor_role === "DELIVERY_PARTNER" ? "Applicant" : e.actor_id === null ? "System" : e.actor_id === me ? "You" : `Staff #${e.actor_id}`;
const eventText = (p) =>
  p?.text ?? p?.message ?? [p?.type && DOC_LABEL[p.type], p?.key && CHECK_INFO[p.key]?.[0], p?.reason, p?.note].filter(Boolean).join(" — ");

// The file link lives 120 s. A failed image gets one more link on its own (I5, C13); a PDF in a frame cannot report failure,
// so Reload stays on screen for it.
const DocPreview = ({ applicationId, doc, onOpened }) => {
  const [link, setLink] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retried = useRef(false);

  useEffect(() => {
    retried.current = false;
  }, [applicationId, doc.type, doc.uploaded_at]);

  useEffect(() => {
    let current = true;
    setLink(null);
    setFailed(false);
    partnerReviewApi
      .documentUrl(applicationId, doc.type)
      .then((next) => {
        if (!current) return;
        setLink(next);
        onOpened(); // the server logged the view; the detail now says this file may be verified
      })
      .catch(() => current && setFailed(true));
    return () => {
      current = false;
    };
  }, [applicationId, doc.type, doc.uploaded_at, attempt, onOpened]);

  const reload = () => setAttempt((n) => n + 1);
  const onImageError = () => {
    if (retried.current) return setFailed(true);
    retried.current = true;
    reload();
  };
  const label = DOC_LABEL[doc.type];

  return (
    <>
      <div className="flex h-96 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted text-sm text-muted-foreground">
        {failed ? (
          <span>Could not load this document.</span>
        ) : !link ? (
          <span>Loading…</span>
        ) : doc.mime === "application/pdf" ? (
          <iframe title={label} src={link.url} className="h-full w-full" />
        ) : (
          <img alt={label} src={link.url} onError={onImageError} className="max-h-full max-w-full object-contain" />
        )}
      </div>
      <button type="button" onClick={reload} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
        <RotateCw className="h-3.5 w-3.5" /> Reload document
      </button>
    </>
  );
};

const Review = ({ detail, action, refetch, profile }) => {
  const me = Number(profile?.id);
  const canDecide = DECIDERS.includes(profile?.role);
  const { deliveryZonesData } = useDeliveryZone(1, 100);
  const zones = (deliveryZonesData?.data?.deliveryZones ?? []).filter((z) => z.is_active !== false);

  const [docType, setDocType] = useState(null);
  const [expiry, setExpiry] = useState("");
  const [reuploading, setReuploading] = useState(false);
  const [reason, setReason] = useState("");
  const [bgRef, setBgRef] = useState("");
  const [note, setNote] = useState("");
  const [dialog, setDialog] = useState(null); // "changes" | "reject"
  const [changes, setChanges] = useState({ message: "", items: [] });
  const [rejection, setRejection] = useState({ code: "", note: "" });
  // What the approver typed. These live here, not in the detail, so a 409 refetch keeps them (A4, I4).
  const [zoneId, setZoneId] = useState("");
  const [limit, setLimit] = useState(3);
  const [approvalNote, setApprovalNote] = useState("");
  const [refused, setRefused] = useState([]);

  const busy = action.isPending;
  const run = (call, done) => action.mutate(call, { onSuccess: done, onError: (error) => notify.apiError(error) });

  // Tabs: the documents on file, plus the required ones the server says are missing.
  const missing = detail.gaps.filter((g) => g.code === "DOC_MISSING").map((g) => g.doc);
  const tabs = DOC_ORDER.filter((type) => detail.documents.some((d) => d.type === type) || missing.includes(type));
  const current = tabs.includes(docType) ? docType : tabs[0];
  const doc = detail.documents.find((d) => d.type === current);
  // A file replaced since this reviewer last opened it. Shown on the tab: the open file's own mark would clear as soon as it loads.
  const replaced = (d) => d?.viewed_by_me_at && new Date(d.viewed_by_me_at) < new Date(d.uploaded_at);

  const chosenZone = zoneId || String(detail.preferred_zone?.id ?? "");
  const gaps = detail.gaps.length ? detail.gaps : refused;
  const creator = detail.source === "ADMIN" && Number(detail.created_by) === me;
  const decided = ["APPROVED", "REJECTED"].includes(detail.status);
  const done = detail.checks.filter((c) => c.done).length;
  const expiresSoon = detail.warnings.find((w) => w.code === "LICENCE_EXPIRES_SOON");
  const reviewer = detail.reviewer_id === null ? null : detail.reviewer_id === me ? "you" : `staff #${detail.reviewer_id}`;
  const rejectCodes = detail.status === "CHANGES_REQUESTED" ? ["NO_RESPONSE"] : Object.keys(REASON_LABEL);

  const verify = () =>
    run(() => partnerReviewApi.verifyDocument(detail.id, doc.type, doc.type === "DL" && (expiry || doc.expiry_date) ? { expiry_date: expiry || doc.expiry_date } : {}), () => setExpiry(""));
  const reupload = () =>
    run(() => partnerReviewApi.requestReupload(detail.id, doc.type, reason.trim()), () => {
      setReuploading(false);
      setReason("");
      notify.success("The applicant has been asked to upload it again");
    });
  const tick = (check) =>
    run(() => partnerReviewApi.setCheck(detail.id, check.key, check.done ? { done: false } : { done: true, note: bgRef.trim() || undefined }), () => check.key === "BG_CHECK" && setBgRef(""));
  const addNote = () => run(() => partnerReviewApi.addNote(detail.id, note.trim()), () => setNote(""));
  const requestChanges = () =>
    run(() => partnerReviewApi.requestChanges(detail.id, { message: changes.message.trim(), items: changes.items, expected_version: detail.version }), () => {
      setDialog(null);
      setChanges({ message: "", items: [] });
      notify.success("Changes requested. The applicant has been texted");
    });
  const reject = () =>
    run(() => partnerReviewApi.reject(detail.id, { reason_code: rejection.code, note: rejection.note.trim(), expected_version: detail.version }), () => {
      setDialog(null);
      setRejection({ code: "", note: "" });
      notify.success("Application rejected");
    });
  const approve = () => {
    setRefused([]);
    action.mutate(
      () =>
        partnerReviewApi.approve(detail.id, {
          zone_id: Number(chosenZone), max_active_orders: Number(limit), note: approvalNote.trim() || undefined, expected_version: detail.version,
        }),
      {
        onSuccess: () => notify.success("Partner activated"),
        onError: (error) => {
          const errors = error.response?.data?.errors;
          if (error.response?.status === 400 && Array.isArray(errors)) setRefused(errors);
          notify.apiError(error);
        },
      }
    );
  };

  const toggleItem = (item) =>
    setChanges((c) => ({ ...c, items: c.items.includes(item) ? c.items.filter((x) => x !== item) : [...c.items, item] }));
  const itemOptions = [
    ...detail.documents.map((d) => [d.type, DOC_LABEL[d.type]]),
    ...Object.entries(FIELD_LABEL).filter(([key]) => key !== "vehicle_number" || detail.vehicle_type !== "CYCLE"),
  ];

  const events = [...detail.events].reverse().map((e) => {
    const text = eventText(e.payload);
    return {
      title: EVENT_LABEL[e.type] ?? e.type,
      sub: (
        <>
          {text && <span className="block whitespace-pre-wrap text-foreground">{text}</span>}
          {actorLabel(e, me)} · {whenIST(e.created_at)}
        </>
      ),
    };
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Review application"
        description="Check documents and the screening list, then decide."
        backTo="/dashboard/delivery-partners"
        backLabel="Applications"
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card className="flex flex-wrap items-center gap-4">
            <Avatar initials={initialsOf(detail.name)} className="h-14 w-14 text-lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-semibold text-foreground">{detail.name || "Unnamed applicant"}</h2>
                <StatusPill status={APPLICATION_STATUS[detail.status]} />
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">{SOURCE_LABEL[detail.source]}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {detail.ref} · {detail.phone} · {detail.preferred_zone?.name ?? "No zone chosen"} ·{" "}
                {[VEHICLE_LABEL[detail.vehicle_type], detail.vehicle_number].filter(Boolean).join(" ")} · applied {whenIST(detail.submitted_at)}
              </p>
              {!detail.decision && (
                <p className="mt-0.5 text-xs text-muted-foreground">{reviewer ? `Being reviewed by ${reviewer}` : "Nobody has started the review"}</p>
              )}
            </div>
            {detail.status === "NEW" && (
              <button type="button" disabled={busy} onClick={() => run(() => partnerReviewApi.startReview(detail.id))} className={SOLID}>
                Start review
              </button>
            )}
          </Card>

          <Card>
            <h3 className="mb-3 font-display text-base font-semibold text-foreground">Documents</h3>
            <div className="flex flex-wrap gap-2">
              {tabs.map((type) => {
                const d = detail.documents.find((x) => x.type === type);
                return (
                  <button
                    key={type}
                    type="button"
                    aria-current={type === current}
                    onClick={() => { setDocType(type); setReuploading(false); setExpiry(""); }}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm ${
                      type === current ? "border-primary bg-primary/5" : "border-border bg-white hover:bg-muted"
                    }`}
                  >
                    <span className="font-medium text-foreground">{DOC_LABEL[type]}</span>
                    <StatusPill status={d ? DOC_STATUS[d.status] : "Not uploaded"} />
                    {replaced(d) && <span className="rounded-full bg-amber/10 px-2 py-0.5 text-[11px] font-semibold text-amber">New file</span>}
                  </button>
                );
              })}
            </div>

            {doc ? (
              <>
                <h3 className="mb-2 mt-5 text-sm font-semibold text-foreground">{DOC_LABEL[doc.type]}</h3>
                <DocPreview applicationId={detail.id} doc={doc} onOpened={refetch} />
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">Number entered by applicant</dt>
                    <dd className="font-medium text-foreground">{doc.number_masked ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Uploaded</dt>
                    <dd className="font-medium text-foreground">{whenIST(doc.uploaded_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">{doc.status === "REJECTED" ? "Sent back because" : "Verified"}</dt>
                    <dd className="font-medium text-foreground">{doc.status === "REJECTED" ? doc.reject_reason : doc.verified_at ? whenIST(doc.verified_at) : "Not yet"}</dd>
                  </div>
                </dl>

                {doc.type === "DL" && doc.status === "UPLOADED" && (
                  <label className="mt-4 block text-sm font-medium">
                    Licence expiry date
                    <input type="date" value={expiry || doc.expiry_date || ""} onChange={(e) => setExpiry(e.target.value)} className={`${FIELD} mt-1 sm:w-56`} />
                  </label>
                )}
                {doc.type === "DL" && doc.status !== "UPLOADED" && doc.expiry_date && <p className="mt-4 text-sm text-muted-foreground">Licence expires {doc.expiry_date}</p>}

                {reuploading && (
                  <label className="mt-4 block text-sm font-medium">
                    What should the applicant fix? They read this.
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={500} placeholder="The photo is blurry, please upload a clearer one." className={AREA} />
                  </label>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                  <span className="mr-auto text-xs text-muted-foreground">
                    {doc.status === "UPLOADED" && !doc.can_verify ? doc.verify_blocked_by : "Several problems? Use Request changes."}
                  </span>
                  {reuploading ? (
                    <>
                      <button type="button" onClick={() => setReuploading(false)} className={GHOST}>Cancel</button>
                      <button type="button" disabled={busy || reason.trim().length < 3} onClick={reupload} className={SOLID}>Send back</button>
                    </>
                  ) : (
                    <>
                      <button type="button" disabled={busy || !doc.can_reupload} onClick={() => setReuploading(true)} className={GHOST}>Ask to re-upload</button>
                      <button type="button" disabled={busy || !doc.can_verify} onClick={verify} className={SOLID}>Mark verified</button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground">{current ? `${DOC_LABEL[current]} has not been uploaded yet.` : "No documents yet."}</p>
            )}
          </Card>

          <Card className="space-y-4">
            <h3 className="font-display text-base font-semibold text-foreground">Activity</h3>
            <div className="flex gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={2000}
                placeholder="Add a note. Only staff can see it."
                aria-label="Note"
                className={FIELD}
              />
              <button type="button" disabled={busy || !note.trim()} onClick={addNote} className={SOLID}>Add</button>
            </div>
            <Timeline items={events} />
          </Card>
        </div>

        <Card className="space-y-4 self-start">
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">Screening checklist</h2>
            <p className="text-xs text-muted-foreground">{done} of {detail.checks.length} checks done</p>
          </div>
          <ul className="space-y-2">
            {detail.checks.map((c) => {
              const [label, sub] = CHECK_INFO[c.key] ?? [c.key, ""];
              const askRef = c.key === "BG_CHECK" && !c.done;
              return (
                <li key={c.key} className="rounded-lg border border-border p-3">
                  <label className={`flex items-start gap-3 ${c.can_tick ? "cursor-pointer" : ""}`}>
                    <input
                      type="checkbox"
                      checked={c.done}
                      disabled={busy || !c.can_tick || (askRef && bgRef.trim().length < 3)}
                      onChange={() => tick(c)}
                      className="mt-0.5 h-4 w-4 accent-primary"
                    />
                    <span>
                      <span className="block text-sm font-medium text-foreground">{label}</span>
                      <span className="block text-xs text-muted-foreground">{c.key === "RC_MATCH" && detail.vehicle_number ? detail.vehicle_number : sub}</span>
                      {c.done && c.note && <span className="block text-xs text-foreground">Ref: {c.note}</span>}
                      {!c.done && !c.can_tick && c.key !== "PHONE_OTP" && <span className="block text-xs text-amber">{c.blocked_by}</span>}
                    </span>
                  </label>
                  {askRef && c.can_tick && (
                    <input value={bgRef} onChange={(e) => setBgRef(e.target.value)} maxLength={500} placeholder="Report reference" aria-label="Report reference" className={`${FIELD} mt-2`} />
                  )}
                </li>
              );
            })}
          </ul>

          {decided ? (
            <div className="space-y-1 border-t border-border pt-4 text-sm">
              <p className="font-semibold text-foreground">{detail.status === "APPROVED" ? "Approved" : "Rejected"} · {whenIST(detail.decision?.decided_at)}</p>
              {detail.status === "REJECTED" && <p className="text-muted-foreground">{REASON_LABEL[detail.decision?.reason_code]}</p>}
              {detail.decision?.note && <p className="whitespace-pre-wrap text-muted-foreground">{detail.decision.note}</p>}
              {detail.status === "APPROVED" && detail.decision?.partner_id && (
                <Link to={`/dashboard/delivery-partners/${detail.decision.partner_id}`} className="font-semibold text-primary hover:underline">View partner</Link>
              )}
            </div>
          ) : (
            <>
              {canDecide && (
                <div className="space-y-3 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">On approval</p>
                  <label className="block text-sm font-medium">
                    Zone
                    <select className={`${FIELD} mt-1`} value={chosenZone} onChange={(e) => { setZoneId(e.target.value); setRefused([]); }}>
                      <option value="">Choose a zone</option>
                      {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Max active orders
                    <select className={`${FIELD} mt-1`} value={limit} onChange={(e) => setLimit(e.target.value)}>
                      {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Note for the record
                    <textarea value={approvalNote} onChange={(e) => setApprovalNote(e.target.value)} rows={3} maxLength={1000} className={AREA} />
                  </label>
                  {expiresSoon && <p className="text-xs text-amber">The licence expires in {expiresSoon.days} days.</p>}
                  {detail.status === "UNDER_REVIEW" && gaps.length > 0 && (
                    <ul className="list-disc space-y-1 pl-5 text-xs text-destructive">
                      {gaps.map((g, i) => <li key={`${g.code}-${i}`}>{g.message}</li>)}
                    </ul>
                  )}
                  {creator && <p className="text-xs text-muted-foreground">You created this application, so someone else has to approve it.</p>}
                  {detail.status === "NEW" && <p className="text-xs text-muted-foreground">Start the review to approve.</p>}
                  {detail.status === "CHANGES_REQUESTED" && <p className="text-xs text-muted-foreground">Waiting for the applicant.</p>}
                </div>
              )}

              <div className="space-y-2">
                {canDecide && (
                  <button
                    type="button"
                    disabled={busy || !detail.can_decide.approve || !chosenZone}
                    onClick={approve}
                    className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-border disabled:text-muted-foreground"
                  >
                    Approve &amp; activate
                  </button>
                )}
                <div className={`grid gap-2 ${canDecide ? "grid-cols-2" : ""}`}>
                  <button type="button" disabled={busy || !detail.can_decide.request_changes} onClick={() => setDialog("changes")} className="h-10 whitespace-nowrap rounded-lg border border-border px-2 text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">
                    Request changes
                  </button>
                  {canDecide && (
                    <button
                      type="button"
                      disabled={busy || !detail.can_decide.reject}
                      onClick={() => { setRejection({ code: rejectCodes.length === 1 ? rejectCodes[0] : "", note: "" }); setDialog("reject"); }}
                      className="h-10 rounded-lg border border-destructive/30 text-sm font-semibold text-destructive hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reject
                    </button>
                  )}
                </div>
                {!canDecide && <p className="text-xs text-muted-foreground">Approving and rejecting is done by an admin.</p>}
              </div>
            </>
          )}
        </Card>
      </div>

      <Dialog open={dialog === "changes"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request changes</DialogTitle>
            <DialogDescription>One text goes to the applicant, who fixes everything and sends the application back.</DialogDescription>
          </DialogHeader>
          <label className="block text-sm font-medium">
            Message to the applicant
            <textarea
              value={changes.message}
              onChange={(e) => setChanges((c) => ({ ...c, message: e.target.value }))}
              rows={4}
              maxLength={1000}
              className={AREA}
            />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">The applicant reads this in the app. Keep internal remarks for notes.</span>
          </label>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">What needs fixing</legend>
            {itemOptions.map(([item, label]) => (
              <label key={item} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={changes.items.includes(item)} onChange={() => toggleItem(item)} className="h-4 w-4 accent-primary" />
                {label}
              </label>
            ))}
          </fieldset>
          <DialogFooter className="gap-2">
            <button type="button" onClick={() => setDialog(null)} className={GHOST}>Cancel</button>
            <button type="button" disabled={busy || changes.message.trim().length < 3} onClick={requestChanges} className={SOLID}>Send to applicant</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "reject"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>
              The applicant is told a decision was made and when they can apply again. They never see the reason or the note.
            </DialogDescription>
          </DialogHeader>
          <label className="block text-sm font-medium">
            Reason
            <select className={`${FIELD} mt-1`} value={rejection.code} onChange={(e) => setRejection((r) => ({ ...r, code: e.target.value }))}>
              <option value="">Choose a reason</option>
              {rejectCodes.map((code) => <option key={code} value={code}>{REASON_LABEL[code]}</option>)}
            </select>
          </label>
          {detail.status === "CHANGES_REQUESTED" && (
            <p className="text-xs text-muted-foreground">While the applicant is fixing things, the only reason to reject is no response.</p>
          )}
          <label className="block text-sm font-medium">
            Note for the record
            <textarea value={rejection.note} onChange={(e) => setRejection((r) => ({ ...r, note: e.target.value }))} rows={3} maxLength={1000} className={AREA} />
            {rejection.code === "OTHER" && <span className="mt-1 block text-xs font-normal text-muted-foreground">At least 10 characters.</span>}
          </label>
          <DialogFooter className="gap-2">
            <button type="button" onClick={() => setDialog(null)} className={GHOST}>Cancel</button>
            <button
              type="button"
              disabled={busy || !rejection.code || rejection.note.trim().length < (rejection.code === "OTHER" ? 10 : 3)}
              onClick={reject}
              className="h-9 rounded-lg bg-destructive px-4 text-sm font-semibold text-white hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject application
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const PartnerApplicationReview = () => {
  const { applicationId } = useParams();
  const { detail, isLoading, error, refetch, action } = usePartnerReview(applicationId);
  const { data: profile } = useQuery({ queryKey: ["auth-profile"], queryFn: getProfile });

  if (detail) return <Review detail={detail} action={action} refetch={refetch} profile={profile} />;
  return (
    <div className="space-y-5">
      <PageHeader title="Review application" backTo="/dashboard/delivery-partners" backLabel="Applications" />
      <p className="text-sm text-muted-foreground">
        {isLoading ? "Loading…" : error?.response?.status === 404 ? "This application does not exist." : "Could not load this application. Try again in a moment."}
      </p>
    </div>
  );
};

export default PartnerApplicationReview;
