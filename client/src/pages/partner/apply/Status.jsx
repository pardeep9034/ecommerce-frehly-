import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { Card, Timeline } from "@/components/partner/PartnerBits";
import usePartnerApplication from "@/hooks/use-partnerApplication";
import { notify } from "@/lib/notify";
import { DOC_LABEL, FIELD_LABEL } from "@/lib/partnerReview";

// Only events the server marks visible to the applicant reach this page.
const EVENT_TITLE = {
  SUBMITTED: "Application received",
  REVIEW_STARTED: "Review started",
  CHANGES_REQUESTED: "Changes requested",
  DOC_REJECTED: "A document was sent back",
  RESUBMITTED: "Resubmitted",
  APPROVED: "Approved",
  REJECTED: "Decision made",
};

const HEADING = {
  DRAFT: { icon: Clock, tone: "bg-amber/10 text-amber", title: "Finish your application", text: "Upload your documents and submit to start the review." },
  NEW: { icon: Clock, tone: "bg-amber/10 text-amber", title: "Application received", text: "Our team checks every application by hand. This usually takes 1-2 working days. We'll SMS you when it's done." },
  UNDER_REVIEW: { icon: Clock, tone: "bg-amber/10 text-amber", title: "Application under review", text: "Our team checks every application by hand. This usually takes 1-2 working days. We'll SMS you when it's done." },
  CHANGES_REQUESTED: { icon: Clock, tone: "bg-amber/10 text-amber", title: "Changes needed", text: "We need a few things fixed before we can continue." },
  APPROVED: { icon: CheckCircle2, tone: "bg-success/10 text-success", title: "You're approved", text: "Welcome to Freshly. You can start taking deliveries." },
  REJECTED: { icon: XCircle, tone: "bg-destructive/10 text-destructive", title: "Application not approved", text: "We couldn't approve this application." },
};

const when = (iso) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const Status = () => {
  const navigate = useNavigate();
  const { application, isLoading } = usePartnerApplication();

  useEffect(() => {
    if (!isLoading && !application) navigate("/partner/apply", { replace: true });
  }, [application, isLoading, navigate]);

  if (!application) return <MobileShell header={<div />}><p className="pt-6 text-center text-sm text-muted-foreground">Loading…</p></MobileShell>;

  const { status } = application;
  const { icon: Icon, tone, title, text } = HEADING[status];
  const final = ["APPROVED", "REJECTED"].includes(status);
  const items = application.events
    .filter((e) => EVENT_TITLE[e.type])
    .map((e) => ({ title: EVENT_TITLE[e.type], sub: when(e.created_at) }));
  if (!final && status !== "DRAFT") items.push({ title: "Decision by SMS", sub: "We'll text you the result", pending: true });

  // What the reviewer wrote in their own words: the newest request while we wait for the applicant.
  const ask = status === "CHANGES_REQUESTED" ? application.events.findLast((e) => ["CHANGES_REQUESTED", "DOC_REJECTED"].includes(e.type)) : null;
  const toFix = (ask?.payload?.items ?? []).map((item) => DOC_LABEL[item] ?? FIELD_LABEL[item] ?? item);

  return (
    <MobileShell header={<div />}>
      <div className="space-y-2 pt-6 text-center">
        <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${tone}`}>
          <Icon className="h-8 w-8" />
        </span>
        <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>

      {ask && (
        <div className="space-y-1.5 rounded-xl border border-amber/30 bg-amber/5 p-4 text-sm text-foreground">
          {ask.type === "DOC_REJECTED" ? (
            <>
              <p className="font-semibold">{DOC_LABEL[ask.payload.type]} was sent back</p>
              <p>{ask.payload.reason}</p>
            </>
          ) : (
            <>
              <p>{ask.payload.message}</p>
              {toFix.length > 0 && <p className="text-xs text-muted-foreground">To fix: {toFix.join(", ")}</p>}
            </>
          )}
        </div>
      )}

      {items.length > 0 && (
        <Card className="space-y-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Application {application.ref}</p>
          <Timeline items={items} />
        </Card>
      )}

      {["DRAFT", "CHANGES_REQUESTED"].includes(status) && (
        <Link to="/partner/apply/documents" className="flex h-12 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
          {status === "DRAFT" ? "Continue to documents" : "Replace documents"}
        </Link>
      )}
      {status === "APPROVED" && (
        <Link to="/partner/home" className="flex h-12 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">Go to home</Link>
      )}
      {status === "REJECTED" && application.can_reapply_after && (
        <p className="text-center text-sm text-muted-foreground">You can apply again after {new Date(application.can_reapply_after).toLocaleDateString("en-IN", { dateStyle: "medium" })}.</p>
      )}

      <button type="button" onClick={() => notify.notWired("Contacting support")} className="w-full text-center text-sm font-semibold text-primary">
        Contact support
      </button>
    </MobileShell>
  );
};

export default Status;
