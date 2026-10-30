import { Link } from "react-router-dom";
import PageHeader from "@/components/dashboard/PageHeader";
import { useReturnsOverview } from "@/hooks/use-store";
import { CUSTOMER_RETURN_REASONS, DOOR_REJECT_REASONS } from "@/lib/assignmentStatus";
import { ReviewCard } from "@/pages/store/StoreReturns";

const REASON_LABEL = Object.fromEntries([...DOOR_REJECT_REASONS, ...CUSTOMER_RETURN_REASONS].map((r) => [r.code, r.label]));
const when = (iso) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "—";
const TH = "px-4 py-3 font-semibold";
const TD = "px-4 py-3";

const Table = ({ head, empty, rows, isLoading, error }) => (
  <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-card">
    <table className="w-full text-sm">
      <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
        <tr>
          {head.map((label) => (
            <th key={label} className={TH}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {isLoading ? (
          <tr>
            <td colSpan={head.length} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
          </tr>
        ) : error ? (
          <tr>
            <td colSpan={head.length} className="px-4 py-8 text-center text-destructive">Could not load returns.</td>
          </tr>
        ) : rows.length === 0 ? (
          <tr>
            <td colSpan={head.length} className="px-4 py-8 text-center text-muted-foreground">{empty}</td>
          </tr>
        ) : (
          rows
        )}
      </tbody>
    </table>
  </div>
);

// Across every store. Admins can decide customer return requests here; goods are taken back and checked in the store console.
const Returns = () => {
  const { due, open, toReview, isLoading, error } = useReturnsOverview();
  const sortedDue = [...due].sort((a, b) => Number(b.overdue) - Number(a.overdue) || new Date(a.due_since) - new Date(b.due_since));
  const toCheck = open.filter((row) => row.status === "RECEIVED");

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Returns"
        description="Customer return requests, goods riders still owe a store, and returned items waiting to be checked. Riders holding goods get no new orders."
      />

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Customer requests to review</h2>
        {toReview.length === 0 ? (
          <p className="rounded-xl border border-border bg-white px-4 py-8 text-center text-sm text-muted-foreground shadow-card">
            {isLoading ? "Loading..." : "No return requests."}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {toReview.map((row) => (
              <div key={row.id} className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Store {row.order?.warehouse_id}</p>
                <ReviewCard row={row} orderPath="/admin/orders" />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">With riders</h2>
        <Table
          head={["Order", "Store", "Rider", "What", "Since", "Status"]}
          empty="No rider is holding goods."
          isLoading={isLoading}
          error={error}
          rows={sortedDue.map((row) => (
            <tr key={row.assignment_id} className={`border-b border-border last:border-0 ${row.overdue ? "bg-destructive/5" : ""}`}>
              <td className={TD}>
                <Link to={`/admin/orders/${row.order_id}`} className="font-semibold text-primary hover:underline">
                  #{row.order_id}
                </Link>
              </td>
              <td className={TD}>{row.store_name || `Store ${row.warehouse_id}`}</td>
              <td className={TD}>
                <span className="block font-medium">{row.partner?.name || "—"}</span>
                {row.partner?.phone && <span className="text-xs text-muted-foreground">{row.partner.phone}</span>}
              </td>
              <td className={TD}>{{ DOORSTEP: "Turned away at door", CUSTOMER: "Customer return" }[row.kind] || "Whole order"}</td>
              <td className={TD}>{when(row.due_since)}</td>
              <td className={TD}>
                {row.overdue ? (
                  <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                    Overdue{row.flagged_at ? " · store texted" : ""}
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">On the way</span>
                )}
              </td>
            </tr>
          ))}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Back in store, to check</h2>
        <Table
          head={["Order", "Item", "Qty", "Reason", "Back since"]}
          empty="Nothing waiting to be checked."
          isLoading={isLoading}
          error={error}
          rows={toCheck.map((row) => (
            <tr key={row.id} className="border-b border-border last:border-0">
              <td className={TD}>
                <Link to={`/admin/orders/${row.order_id}`} className="font-semibold text-primary hover:underline">
                  #{row.order?.order_number || row.order_id}
                </Link>
              </td>
              <td className={TD}>{[row.item?.product_name, row.item?.variant_name].filter(Boolean).join(" · ") || "—"}</td>
              <td className={TD}>{Number(row.quantity)}</td>
              <td className={TD}>
                {REASON_LABEL[row.reason] || row.reason}
                {row.note && <span className="block text-xs text-muted-foreground">{row.note}</span>}
              </td>
              <td className={TD}>{when(row.received_at)}</td>
            </tr>
          ))}
        />
      </section>
    </div>
  );
};

export default Returns;
