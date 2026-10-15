import { useOnboardingLog, useSecurityLog } from "@/hooks/use-activityLog";
import { fullIST } from "@/lib/activityLog";
import { Pill } from "./LogParts";

// What each service writes and where it can be read. Static: it describes the code, not the data.
// tone: success = shown on this page, warning = stored but not shown, muted = text log only.
const SERVICES = [
  ["auth-service", "Sign-ins, sign-outs, password resets, blocks", "Database table auth_audit_logs", "Shown in Security", "success"],
  ["delivery-service", "Partner application steps, documents, checks, decisions", "Database table delivery_partner_application_events", "Shown in Onboarding", "success"],
  ["delivery-service", "Delivery status changes", "Database table delivery history", "Stored, not shown", "warning"],
  ["order-service", "Order status changes", "Database table order_status_history", "Stored, not shown", "warning"],
  ["inventory-service", "Stock movements", "Database table stock movements (own page)", "Own page", "warning"],
  ["api-gateway", "Request line only (method and path)", "Console", "Text log only", "muted"],
  ["Other services", "Errors and warnings in plain text", "Console, plus log files in production", "Text log only", "muted"],
];

const Stat = ({ label, value }) => (
  <div className="rounded-lg bg-muted px-4 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-1 font-display text-lg font-semibold text-foreground">{value}</p>
  </div>
);

const count = (value, total) => (value === undefined ? "…" : `${value} of ${total}`);

const SourcesTab = () => {
  // One row is enough: only the totals are used.
  const security = useSecurityLog({ hours: 24, limit: 1 }).meta;
  const onboarding = useOnboardingLog({ hours: 24, limit: 1 }).meta;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-white p-5 shadow-card">
        <h2 className="font-display text-base font-semibold text-foreground">Live coverage</h2>
        <p className="mt-1 text-sm text-muted-foreground">Counts across all time, read from the two sources this page shows.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Security events" value={security?.total ?? "…"} />
          <Stat label="With IP address" value={count(security?.with_ip, security?.total)} />
          <Stat label="Onboarding events" value={onboarding?.total ?? "…"} />
          <Stat label="Latest onboarding" value={onboarding ? fullIST(onboarding.latest_at) : "…"} />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                {["Service", "Records", "Stored in", "On this page"].map((h) => <th key={h} scope="col" className="px-5 py-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {SERVICES.map(([service, records, store, state, tone]) => (
                <tr key={`${service}-${records}`} className="border-b border-border/60 last:border-0">
                  <th scope="row" className="px-5 py-3 font-mono text-[13px] font-medium text-foreground">{service}</th>
                  <td className="px-5 py-3">{records}</td>
                  <td className="px-5 py-3 text-muted-foreground">{store}</td>
                  <td className="px-5 py-3"><Pill tone={tone}>{state}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SourcesTab;
