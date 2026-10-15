import { Navigate, useSearchParams } from "react-router-dom";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import OnboardingTab from "@/components/dashboard/activity/OnboardingTab";
import SecurityTab from "@/components/dashboard/activity/SecurityTab";
import SourcesTab from "@/components/dashboard/activity/SourcesTab";
import SystemTab from "@/components/dashboard/activity/SystemTab";
import { ACTIVITY_LOG } from "@/hooks/use-activityLog";
import { ACTIVITY_ADMIN_ROLES, RANGES } from "@/lib/activityLog";
import { getToken, getTokenRole } from "@/lib/tokenStorage";

const TABS = [
  ["security", "Security"],
  ["onboarding", "Onboarding"],
  ["system", "System"],
  ["sources", "Sources"],
];

// The servers refuse anyone but ADMIN and SUPER_ADMIN; this keeps OPS_STAFF from seeing an empty shell.
const ActivityLog = () => {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const refreshing = useIsFetching({ queryKey: [ACTIVITY_LOG] }) > 0;

  if (!ACTIVITY_ADMIN_ROLES.includes(getTokenRole(getToken()))) return <Navigate to="/dashboard" replace />;

  const tab = TABS.some(([id]) => id === params.get("tab")) ? params.get("tab") : "security";
  const hours = RANGES.some(([h]) => String(h) === params.get("hours")) ? Number(params.get("hours")) : 24;
  // replace: switching tabs or range should not fill the back button
  const setParam = (key, value) => setParams((p) => { const next = new URLSearchParams(p); next.set(key, value); return next; }, { replace: true });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity log"
        description="Who signed in, how partner applications moved, and where each service records what it does."
        action={
          <div className="flex items-center gap-2">
            {tab !== "sources" && tab !== "system" && (
              <select
                aria-label="Time range"
                value={hours}
                onChange={(e) => setParam("hours", e.target.value)}
                className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-foreground"
              >
                {RANGES.map(([h, label]) => <option key={h} value={h}>{label}</option>)}
              </select>
            )}
            <button
              type="button"
              onClick={() => queryClient.invalidateQueries({ queryKey: [ACTIVITY_LOG] })}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-medium text-foreground hover:bg-muted"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" /> Refresh
            </button>
          </div>
        }
      />

      <div role="tablist" aria-label="Log source" className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setParam("tab", id)}
            className={`-mb-px min-h-11 whitespace-nowrap border-b-2 px-4 text-sm font-medium ${
              tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === "security" && <SecurityTab hours={hours} />}
        {tab === "onboarding" && <OnboardingTab hours={hours} />}
        {tab === "system" && <SystemTab />}
        {tab === "sources" && <SourcesTab />}
      </div>
    </div>
  );
};

export default ActivityLog;
