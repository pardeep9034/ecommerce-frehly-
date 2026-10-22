import { useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "@/components/common/Pagination";
import { useLogFilters, useOnboardingLog } from "@/hooks/use-activityLog";
import { actorName, dayIST, fullIST, ONBOARDING_GROUPS, onboardingDot, prettyJson, timeIST } from "@/lib/activityLog";
import { APPLICATION_STATUS, eventText, eventTitle, SOURCE_LABEL, VEHICLE_LABEL } from "@/lib/partnerReview";
import { CodeBlock, DetailCard, Fields, LogFilters, LogTable } from "./LogParts";

const GRID = "grid-cols-[88px_minmax(170px,1.2fr)_minmax(150px,1.2fr)_minmax(180px,1.1fr)_minmax(120px,1.2fr)]";

// Partner application events across every applicant, read from delivery-service. Includes staff opening a document.
const OnboardingTab = ({ hours }) => {
  const filters = useLogFilters(hours);
  const { events, pagination, isLoading, isError } = useOnboardingLog(filters.params);
  const [selectedId, setSelectedId] = useState(null);
  const current = events.find((e) => e.id === selectedId) ?? events[0];

  return (
    <div className="space-y-4">
      <LogFilters
        groups={ONBOARDING_GROUPS}
        group={filters.group}
        onGroup={filters.setGroup}
        term={filters.term}
        onTerm={filters.setTerm}
        placeholder="Applicant, reference or staff id"
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-3">
          <LogTable
            headers={["Time", "Event", "Applicant", "By", "Note"]}
            grid={GRID}
            items={events}
            selectedId={current?.id}
            onSelect={setSelectedId}
            isLoading={isLoading}
            isError={isError}
            empty="No onboarding events match this filter in the selected time range."
            renderRow={(e) => (
              <>
                <span className="flex flex-col">
                  <span className="font-mono text-[13px]">{timeIST(e.created_at)}</span>
                  <span className="text-xs text-muted-foreground">{dayIST(e.created_at)}</span>
                </span>
                <span className="flex min-w-0 items-center gap-2.5">
                  <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${onboardingDot(e.type)}`} />
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground">{eventTitle(e)}</span>
                    <span className="block font-mono text-[11px] text-muted-foreground">{e.type}</span>
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate">{e.application.name}</span>
                  <span className="block text-xs text-muted-foreground">{e.application.ref} · {VEHICLE_LABEL[e.application.vehicle_type] ?? e.application.vehicle_type}</span>
                </span>
                <span className="min-w-0 truncate">{actorName(e)}</span>
                <span className="min-w-0 truncate text-muted-foreground">{eventText(e.payload) || "—"}</span>
              </>
            )}
          />
          <Pagination currentPage={pagination?.currentPage} totalPages={pagination?.totalPages} totalItems={pagination?.totalItems} onPageChange={filters.setPage} />
        </div>

        {current && (
          <DetailCard title={eventTitle(current)} code={current.type}>
            <Fields
              rows={[
                ["When", fullIST(current.created_at)],
                ["Applicant", `${current.application.name} · ${current.application.ref}`],
                ["Application", `${APPLICATION_STATUS[current.application.status] ?? current.application.status} · ${SOURCE_LABEL[current.application.source] ?? current.application.source}`],
                ["Done by", actorName(current)],
                ["Note", eventText(current.payload) || "None"],
              ]}
            />
            {prettyJson(current.payload) && <CodeBlock title="Payload">{prettyJson(current.payload)}</CodeBlock>}
            <Link
              to={`/admin/delivery-partners/applications/${current.application.id}`}
              className="flex h-10 items-center justify-center rounded-lg border border-border bg-white text-sm font-medium text-foreground hover:bg-muted"
            >
              Open the application
            </Link>
          </DetailCard>
        )}
      </div>
    </div>
  );
};

export default OnboardingTab;
