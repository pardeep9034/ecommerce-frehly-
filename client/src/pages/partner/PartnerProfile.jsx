import { useOutletContext } from "react-router-dom";

// Documents (Aadhaar/licence/RC verification) aren't shown here — that data
// belongs to the partner-onboarding module, which hasn't been built yet
// (see DELIVERY_PARTNER_MODULE.md, "Deferred").
const PartnerProfile = () => {
  const { partner } = useOutletContext();

  if (!partner) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const stats = partner.stats || {};
  const initials = (partner.name || "P")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account, vehicle and zones</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-white p-6 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-2xl font-bold text-success">
              {initials}
            </span>
            <h2 className="text-lg font-bold text-foreground">{partner.name}</h2>
            <p className="text-sm text-muted-foreground">{[partner.phone, partner.email].filter(Boolean).join(" · ")}</p>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {partner.status}
            </span>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <h2 className="mb-2 font-bold text-foreground">Last 7 days</h2>
            {[
              ["Delivered", stats.delivered_7d ?? "—"],
              ["Failed attempts", stats.failed_7d ?? "—"],
              ["On-time rate", stats.on_time_rate_7d != null ? `${stats.on_time_rate_7d}%` : "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-t border-border py-2.5 text-sm first:border-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-border bg-white p-5">
            <h2 className="mb-2 font-bold text-foreground">Vehicle</h2>
            {[
              ["Type", partner.vehicle_type],
              ["Number", partner.vehicle_number],
              ["Max active orders", partner.max_active_orders],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-t border-border py-2.5 text-sm first:border-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold">{value ?? "—"}</span>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <h2 className="mb-3 font-bold text-foreground">Delivery zones</h2>
            <div className="flex flex-wrap gap-2">
              {(partner.zones || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No zones assigned yet.</p>
              ) : (
                partner.zones.map((zone) => (
                  <span
                    key={zone.id}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                      zone.is_primary ? "bg-success/10 text-success" : "bg-muted text-foreground"
                    }`}
                  >
                    {zone.name}
                    {zone.is_primary ? " (primary)" : ""}
                  </span>
                ))
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Zones are set by the Freshly admin team.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PartnerProfile;
