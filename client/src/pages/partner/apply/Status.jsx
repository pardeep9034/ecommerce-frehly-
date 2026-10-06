import { Clock } from "lucide-react";
import { Link } from "react-router-dom";
import MobileShell from "@/components/partner/MobileShell";
import { Card, DemoNote, Timeline } from "@/components/partner/PartnerBits";
import { notify } from "@/lib/notify";
import { APPLICATION_TIMELINE } from "@/lib/partnerDemoData";

const Status = () => (
  <MobileShell header={<div />}>
    <div className="space-y-2 pt-6 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber/10 text-amber">
        <Clock className="h-8 w-8" />
      </span>
      <h1 className="font-display text-2xl font-bold text-foreground">Application under review</h1>
      <p className="text-sm text-muted-foreground">
        Our team checks every application by hand. This usually takes 1–2 working days. We’ll SMS you when it’s done.
      </p>
    </div>

    <Card className="space-y-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">Application FR-P-2231</p>
      <Timeline items={APPLICATION_TIMELINE} />
    </Card>

    <Card className="space-y-2 border-amber/30 bg-amber/5">
      <p className="text-sm font-semibold text-foreground">Driving licence needed</p>
      <p className="text-xs text-muted-foreground">Upload it now so review isn’t delayed.</p>
      <Link to="/partner/apply/documents" className="flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
        Upload driving licence
      </Link>
    </Card>

    <button type="button" onClick={() => notify.notWired("Contacting support")} className="w-full text-center text-sm font-semibold text-primary">
      Contact support
    </button>
    <DemoNote>The status shown is a demo — real application tracking isn't built yet.</DemoNote>
  </MobileShell>
);

export default Status;
