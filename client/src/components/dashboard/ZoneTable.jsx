import { Pencil, Trash2, Map } from "lucide-react";

const pincodeCount = (postalCodes) =>
  String(postalCodes || "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean).length;

const ZoneTable = ({ zones = [], onEdit, onDelete, isLoading, selectedId }) => {
  if (!isLoading && !zones.length) {
    return (
      <div className="rounded-xl border border-border bg-white p-10 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Map className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">No delivery zones found</p>
        <p className="mt-1 text-xs text-muted-foreground">Add a zone to start covering new pincodes.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted text-left">
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Code</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Zone</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Pincodes</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Radius</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Fee</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Min order</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">ETA</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Status</th>
              <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => (
              <tr
                key={zone.id}
                className={`border-b border-border transition-colors last:border-0 hover:bg-muted ${
                  selectedId === zone.id ? "bg-secondary" : ""
                }`}
              >
                <td className="px-5 py-4 font-mono text-xs text-foreground sm:px-6">{zone.code}</td>
                <td className="px-5 py-4 sm:px-6">
                  <span className="font-medium text-foreground">{zone.name}</span>
                  <span className="block text-xs text-muted-foreground">{zone.city}</span>
                </td>
                <td className="px-5 py-4 text-muted-foreground sm:px-6">{pincodeCount(zone.postal_codes)}</td>
                <td className="px-5 py-4 text-muted-foreground sm:px-6">
                  {zone.radius_km != null ? `${zone.radius_km} km` : "—"}
                </td>
                <td className="px-5 py-4 text-muted-foreground sm:px-6">₹{zone.delivery_fee ?? 0}</td>
                <td className="px-5 py-4 text-muted-foreground sm:px-6">₹{zone.minimum_order_amount ?? 0}</td>
                <td className="px-5 py-4 text-muted-foreground sm:px-6">
                  {zone.estimated_delivery_time != null ? `${zone.estimated_delivery_time} min` : "—"}
                </td>
                <td className="px-5 py-4 sm:px-6">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      zone.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {zone.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(zone)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(zone.id)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ZoneTable;
