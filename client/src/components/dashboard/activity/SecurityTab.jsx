import { useState } from "react";
import Pagination from "@/components/common/Pagination";
import { useLogFilters, useSecurityLog } from "@/hooks/use-activityLog";
import { dayIST, fullIST, prettyJson, SECURITY_GROUPS, securityEvent, shortAgent, timeIST } from "@/lib/activityLog";
import { CodeBlock, DetailCard, Fields, LogFilters, LogTable, Note, Pill } from "./LogParts";

const GRID = "grid-cols-[88px_minmax(170px,1.3fr)_minmax(140px,1.2fr)_88px_minmax(110px,1fr)]";

// Sign-in, sign-out, password reset, block and unblock, read from auth-service's audit table.
const SecurityTab = ({ hours }) => {
  const filters = useLogFilters(hours);
  const { events, pagination, meta, isLoading, isError } = useSecurityLog(filters.params);
  const [selectedId, setSelectedId] = useState(null);
  const current = events.find((e) => e.id === selectedId) ?? events[0];
  const ok = (e) => e.status === "SUCCESS";

  return (
    <div className="space-y-4">
      {meta && meta.with_ip < meta.total && (
        <Note tone="warning">
          <strong>IP address is recorded on {meta.with_ip} of {meta.total} events.</strong> The sign-in code does not pass it to the audit log yet.
        </Note>
      )}

      <LogFilters
        groups={SECURITY_GROUPS}
        group={filters.group}
        onGroup={filters.setGroup}
        term={filters.term}
        onTerm={filters.setTerm}
        placeholder="Phone, email, user id or IP"
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-3">
          <LogTable
            headers={["Time", "Event", "Who", "Result", "Device"]}
            grid={GRID}
            items={events}
            selectedId={current?.id}
            onSelect={setSelectedId}
            isLoading={isLoading}
            isError={isError}
            empty="No security events match this filter in the selected time range."
            renderRow={(e) => {
              const event = securityEvent(e.event_type);
              return (
                <>
                  <span className="flex flex-col">
                    <span className="font-mono text-[13px]">{timeIST(e.created_at)}</span>
                    <span className="text-xs text-muted-foreground">{dayIST(e.created_at)}</span>
                  </span>
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${event.dot}`} />
                    <span className="min-w-0">
                      <span className="block font-medium text-foreground">{event.label}</span>
                      <span className="block font-mono text-[11px] text-muted-foreground">{e.event_type}</span>
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate">{e.phone ?? e.email ?? "—"}</span>
                    <span className="block text-xs text-muted-foreground">{e.user_id ? `user #${e.user_id}` : "no account"}</span>
                  </span>
                  <span><Pill tone={ok(e) ? "success" : "danger"}>{ok(e) ? "Success" : "Failed"}</Pill></span>
                  <span className="truncate text-muted-foreground">{shortAgent(e.user_agent)}</span>
                </>
              );
            }}
          />
          <Pagination currentPage={pagination?.currentPage} totalPages={pagination?.totalPages} totalItems={pagination?.totalItems} onPageChange={filters.setPage} />
        </div>

        {current && (
          <DetailCard
            title={securityEvent(current.event_type).label}
            code={current.event_type}
            badge={<Pill tone={ok(current) ? "success" : "danger"}>{ok(current) ? "Success" : "Failed"}</Pill>}
          >
            <Fields
              rows={[
                ["When", fullIST(current.created_at)],
                ["Account", [current.name, current.phone ?? current.email, current.user_id && `user #${current.user_id}`].filter(Boolean).join(" · ")],
                ["Reason", current.error_message ?? "None"],
                ["IP address", current.ip_address],
                ["Device id", current.device_id],
                ["User agent", current.user_agent],
              ]}
            />
            {prettyJson(current.details) && <CodeBlock title="Details">{prettyJson(current.details)}</CodeBlock>}
          </DetailCard>
        )}
      </div>
    </div>
  );
};

export default SecurityTab;
