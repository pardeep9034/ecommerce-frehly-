import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/dashboard/PageHeader";
import Pagination from "@/components/common/Pagination";
import { Avatar, DemoNote, StatusPill } from "@/components/partner/PartnerBits";
import useDeliveryZone from "@/hooks/use-deliveryZone";
import { usePartners } from "@/hooks/use-delivery";
import {
  APPLICATIONS, APPLICATION_STATUSES, PARTNER_SUMMARY, ZONES,
} from "@/lib/partnerDemoData";

const TH = "px-5 py-3.5 font-medium text-muted-foreground";
const TD = "px-5 py-4";
const SELECT = "h-9 rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none";
const PARTNER_STATUS_LABELS = { ACTIVE: "Active", SUSPENDED: "Suspended", INACTIVE: "Inactive" };

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
  // Applications tab (demo data): zone is a name, status a label.
  const [zone, setZone] = useState("");
  const [status, setStatus] = useState("");
  // Partners tab (server): zone is an id, status an enum, search is sent after a pause in typing.
  const [partnerZone, setPartnerZone] = useState("");
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
  }, [search, partnerZone, partnerStatus]);

  const { partners, pagination, isLoading, isError } = usePartners({
    page,
    limit: 10,
    search: search || undefined,
    zone_id: partnerZone || undefined,
    status: partnerStatus || undefined,
  });
  const { deliveryZonesData } = useDeliveryZone(1, 100);
  const zones = deliveryZonesData?.data?.deliveryZones ?? [];

  const switchTab = (next) => {
    setParams(next === "partners" ? { tab: next } : {}, { replace: true });
    setStatus("");
  };
  const matches = (row) => (!zone || row.zone === zone) && (!status || row.status === status);
  const applications = APPLICATIONS.filter(matches);

  const tabs = [
    { key: "applications", label: "Applications", count: PARTNER_SUMMARY[0].value },
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
        {PARTNER_SUMMARY.map((s) => (
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
        {tab === "partners" ? (
          <div className="ml-auto flex flex-wrap gap-2 pb-2">
            <input
              type="search"
              aria-label="Search partners"
              placeholder="Name, phone or vehicle"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${SELECT} w-52`}
            />
            <select aria-label="Zone" value={partnerZone} onChange={(e) => setPartnerZone(e.target.value)} className={SELECT}>
              <option value="">All zones</option>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
            <select aria-label="Status" value={partnerStatus} onChange={(e) => setPartnerStatus(e.target.value)} className={SELECT}>
              <option value="">All statuses</option>
              {Object.entries(PARTNER_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        ) : (
          <div className="ml-auto flex gap-2 pb-2">
            <select aria-label="Zone" value={zone} onChange={(e) => setZone(e.target.value)} className={SELECT}>
              <option value="">All zones</option>
              {ZONES.map((z) => <option key={z}>{z}</option>)}
            </select>
            <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className={SELECT}>
              <option value="">All statuses</option>
              {APPLICATION_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}
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
                {applications.length === 0 && <Empty>No applications match these filters.</Empty>}
                {applications.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted">
                    <td className={TD}><Person initials={a.initials} name={a.name} sub={a.phone} /></td>
                    <td className={`${TD} text-muted-foreground`}>{a.zone}</td>
                    <td className={`${TD} text-muted-foreground`}>{a.vehicle}</td>
                    <td className={`${TD} text-muted-foreground`}>{a.source}</td>
                    <td className={`${TD} text-muted-foreground`}>{a.submitted}</td>
                    <td className={`${TD} ${a.docs[0] < a.docs[1] ? "font-semibold text-amber" : "text-foreground"}`}>{a.docs[0]} / {a.docs[1]}</td>
                    <td className={TD}><StatusPill status={a.status} /></td>
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
                    <td className={TD}><StatusPill status={PARTNER_STATUS_LABELS[p.status] ?? p.status} /></td>
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
      {tab === "partners" && (
        <Pagination
          currentPage={page}
          totalPages={pagination?.totalPages ?? 0}
          totalItems={pagination?.totalItems ?? 0}
          onPageChange={setPage}
        />
      )}
      <DemoNote>
        {tab === "partners"
          ? "The partner list is live. The four counts above and the partner profile page are still demo data; every partner shows Offline until partner sign-in exists."
          : "Counts and applications above are demo data — the backend has no application queue yet."}
      </DemoNote>
    </div>
  );
};

export default DeliveryPartners;
