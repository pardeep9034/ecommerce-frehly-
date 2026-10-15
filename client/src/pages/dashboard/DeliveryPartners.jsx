import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/dashboard/PageHeader";
import Pagination from "@/components/common/Pagination";
import { Avatar, DemoNote, StatusPill } from "@/components/partner/PartnerBits";
import useDeliveryZone from "@/hooks/use-deliveryZone";
import { usePartners } from "@/hooks/use-delivery";
import { usePartnerQueue, usePartnerSummary } from "@/hooks/use-partnerReview";
import { PARTNER_SUMMARY } from "@/lib/partnerDemoData";
import { APPLICATION_STATUS, PARTNER_STATUS, SOURCE_LABEL, VEHICLE_LABEL, waitingFor, whenIST } from "@/lib/partnerReview";

const TH = "px-5 py-3.5 font-medium text-muted-foreground";
const TD = "px-5 py-4";
const SELECT = "h-9 rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none";

const initialsOf = (name) => (name || "?").split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

const Empty = ({ children }) => (
  <tr>
    <td colSpan={8} className="px-5 py-10 text-center text-sm text-muted-foreground">{children}</td>
  </tr>
);

const Person = ({ initials, name, sub }) => (
  <div className="flex items-center gap-3">
    <Avatar initials={initials} />
    <div>
      <span className="block font-medium text-foreground">{name}</span>
      {sub && <span className="block text-xs text-muted-foreground">{sub}</span>}
    </div>
  </div>
);

const DeliveryPartners = () => {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "partners" ? "partners" : "applications";
  // Both tabs come from the server: zone is an id, status an enum, search is sent after a pause in typing.
  // Zone and search are shared; the status lists differ, so each tab keeps its own.
  const [zoneId, setZoneId] = useState("");
  const [status, setStatus] = useState("");
  const [partnerStatus, setPartnerStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchTerm.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [search, zoneId, status, partnerStatus]);

  const filters = { page, limit: 10, search: search || undefined, zone_id: zoneId || undefined };
  const { partners, pagination, isLoading, isError } = usePartners({ ...filters, status: partnerStatus || undefined });
  const queue = usePartnerQueue({ ...filters, status: status || undefined });
  const { deliveryZonesData } = useDeliveryZone(1, 100);
  const zones = deliveryZonesData?.data?.deliveryZones ?? [];
  const { summary, isError: summaryFailed } = usePartnerSummary();
  // The first card is live; the other three have no endpoint yet (PARTNER_SUMMARY).
  const waiting = {
    label: "Waiting for review",
    value: summary ? summary.waiting : "–",
    hint: summary ? (summary.oldest_submitted_at ? `Oldest: ${waitingFor(summary.oldest_submitted_at)}` : "Nothing waiting") : summaryFailed ? "Could not load" : "Loading…",
  };

  const switchTab = (next) => {
    setParams(next === "partners" ? { tab: next } : {}, { replace: true });
    setPage(1);
  };

  const tabs = [
    { key: "applications", label: "Applications", count: queue.pagination?.totalItems ?? "–" },
    { key: "partners", label: "Partners", count: pagination?.totalItems ?? "–" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Delivery partners"
        description="Onboard, verify and manage delivery partners across all zones."
        action={
          <Link
            to="/dashboard/delivery-partners/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add partner
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {[waiting, ...PARTNER_SUMMARY].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-white p-4 shadow-card">
            <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-foreground">{s.value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-border">
        <div role="tablist" aria-label="Partner lists" className="flex">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => switchTab(t.key)}
              className={`-mb-px flex min-h-11 items-center gap-2 border-b-[3px] px-4 text-sm ${
                tab === t.key ? "border-primary font-bold text-primary" : "border-transparent font-medium text-muted-foreground"
              }`}
            >
              {t.label}
              <span className="rounded-full bg-muted px-2 text-[11px] font-semibold">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap gap-2 pb-2">
          <input
            type="search"
            aria-label={tab === "partners" ? "Search partners" : "Search applications"}
            placeholder={tab === "partners" ? "Name, phone or vehicle" : "Name, phone or reference"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${SELECT} w-52`}
          />
          <select aria-label="Zone" value={zoneId} onChange={(e) => setZoneId(e.target.value)} className={SELECT}>
            <option value="">All zones</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          {tab === "partners" ? (
            <select aria-label="Status" value={partnerStatus} onChange={(e) => setPartnerStatus(e.target.value)} className={SELECT}>
              <option value="">All statuses</option>
              {Object.entries(PARTNER_STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          ) : (
            <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className={SELECT}>
              <option value="">Waiting for a decision</option>
              {Object.entries(APPLICATION_STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
        <div className="overflow-x-auto">
          {tab === "applications" ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted text-left">
                  {["Applicant", "Zone", "Vehicle", "Source", "Submitted", "Docs", "Status", ""].map((h) => <th key={h} className={TH}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {queue.isLoading && <Empty>Loading applications…</Empty>}
                {queue.isError && <Empty>Could not load applications. Try again in a moment.</Empty>}
                {!queue.isLoading && !queue.isError && queue.applications.length === 0 && <Empty>No applications match these filters.</Empty>}
                {queue.applications.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted">
                    <td className={TD}><Person initials={initialsOf(a.name)} name={a.name || "Unnamed applicant"} sub={`${a.ref} · ${a.phone}`} /></td>
                    <td className={`${TD} text-muted-foreground`}>{a.preferred_zone?.name ?? "—"}</td>
                    <td className={`${TD} text-muted-foreground`}>{[VEHICLE_LABEL[a.vehicle_type], a.vehicle_number].filter(Boolean).join(" · ") || "—"}</td>
                    <td className={`${TD} text-muted-foreground`}>{SOURCE_LABEL[a.source]}</td>
                    <td className={`${TD} text-muted-foreground`}>{whenIST(a.submitted_at)}</td>
                    <td className={`${TD} ${a.documents.verified < a.documents.required ? "font-semibold text-amber" : "text-foreground"}`}>{a.documents.verified} / {a.documents.required}</td>
                    <td className={TD}><StatusPill status={APPLICATION_STATUS[a.status]} /></td>
                    <td className={`${TD} text-right`}>
                      <Link to={`/dashboard/delivery-partners/applications/${a.id}`} className="text-sm font-semibold text-primary hover:underline">Review</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted text-left">
                  {["Partner", "Zone", "Vehicle", "Now", "Active orders", "Delivered today", "Account", ""].map((h) => <th key={h} className={TH}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {isLoading && <Empty>Loading partners…</Empty>}
                {isError && <Empty>Could not load partners. Try again in a moment.</Empty>}
                {!isLoading && !isError && partners.length === 0 && <Empty>No partners match these filters.</Empty>}
                {partners.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted">
                    <td className={TD}><Person initials={initialsOf(p.name)} name={p.name || "Unnamed partner"} sub={p.phone} /></td>
                    <td className={`${TD} text-muted-foreground`}>{p.zone?.name ?? "—"}</td>
                    <td className={`${TD} text-muted-foreground`}>{[p.vehicle_type, p.vehicle_number].filter(Boolean).join(" · ") || "—"}</td>
                    <td className={TD}><StatusPill status={p.is_online ? "Online" : "Offline"} /></td>
                    <td className={TD}>{p.current_active_orders ?? 0} / {p.max_active_orders ?? "—"}</td>
                    <td className={TD}>{p.delivered_today}</td>
                    <td className={TD}><StatusPill status={PARTNER_STATUS[p.status] ?? p.status} /></td>
                    <td className={`${TD} text-right`}>
                      <Link to={`/dashboard/delivery-partners/${p.id}`} className="text-sm font-semibold text-primary hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Pagination
        currentPage={page}
        totalPages={(tab === "partners" ? pagination : queue.pagination)?.totalPages ?? 0}
        totalItems={(tab === "partners" ? pagination : queue.pagination)?.totalItems ?? 0}
        onPageChange={setPage}
      />
      <DemoNote>
        {tab === "partners"
          ? "The partner list is live. The Active, Online and Suspended counts and the partner's delivery stats are still demo data; every partner shows Offline until partner sign-in exists."
          : "The applications list and the Waiting for review count are live. The Active, Online and Suspended counts are still demo data."}
      </DemoNote>
    </div>
  );
};

export default DeliveryPartners;
