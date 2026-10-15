import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import StageBadge from "../../components/store/StageBadge";
import { deriveStage } from "../../lib/orderStage";
import {
  useStoreOrder,
  useUpdateItemStatus,
  useFinalizeItems,
  usePackOrder,
  useAvailableRiders,
  useAssignRider,
} from "../../hooks/use-store";

const ItemRow = ({ item, orderId, disabled }) => {
  const [reason, setReason] = useState("");
  const { mutate: updateItem, isPending } = useUpdateItemStatus();

  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3">
        <span className="font-semibold">{item.product_name}</span>
        {item.variant_name && <span className="ml-1.5 text-xs text-muted-foreground">{item.variant_name}</span>}
      </td>
      <td className="px-4 py-3 text-muted-foreground">× {item.quantity}</td>
      <td className="px-4 py-3">
        {item.status === "NOT_AVAILABLE" && (
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason for customer"
            className="w-full rounded-lg border border-border px-2.5 py-1.5 text-xs outline-none focus:border-primary"
          />
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            disabled={disabled || isPending}
            onClick={() => updateItem({ orderId, itemId: item.id, status: "READY" })}
            className={`h-8 rounded-lg border px-3 text-xs font-semibold disabled:opacity-50 ${
              item.status === "READY" ? "border-success bg-success text-white" : "border-border text-muted-foreground"
            }`}
          >
            Picked
          </button>
          <button
            type="button"
            disabled={disabled || isPending}
            onClick={() => updateItem({ orderId, itemId: item.id, status: "NOT_AVAILABLE", admin_remarks: reason })}
            className={`h-8 rounded-lg border px-3 text-xs font-semibold disabled:opacity-50 ${
              item.status === "NOT_AVAILABLE" ? "border-destructive bg-destructive text-white" : "border-border text-muted-foreground"
            }`}
          >
            Not available
          </button>
        </div>
      </td>
    </tr>
  );
};

const PickSection = ({ order }) => {
  const items = order.items || [];
  const allReviewed = items.length > 0 && items.every((item) => item.status !== "PENDING");
  const { mutate: finalize, isPending } = useFinalizeItems();

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="font-bold text-foreground">Items</h2>
        <span className="text-sm text-muted-foreground">
          {items.filter((i) => i.status === "READY").length} picked · {items.filter((i) => i.status === "NOT_AVAILABLE").length} not available ·{" "}
          {items.filter((i) => i.status === "PENDING").length} to pick
        </span>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-2">Item</th>
            <th className="px-4 py-2">Qty</th>
            <th className="px-4 py-2">Reason / remark</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <ItemRow key={item.id} item={item} orderId={order.id} disabled={order.status !== "PLACED" && order.status !== "CONFIRMED"} />
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-3 border-t border-border bg-muted px-5 py-4">
        <p className="flex-grow text-xs text-muted-foreground">
          Mark every item, then finalize. All picked → packing. Some missing → customer is asked first.
        </p>
        <button
          type="button"
          disabled={!allReviewed || isPending}
          onClick={() => finalize(order.id)}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {allReviewed ? "Finalize items" : `Finalize (${items.filter((i) => i.status === "PENDING").length} left)`}
        </button>
      </div>
    </section>
  );
};

const PackSection = ({ order }) => {
  const [bagCount, setBagCount] = useState(order.bag_count || 1);
  const [rackLabel, setRackLabel] = useState(order.rack_label || "");
  const { mutate: pack, isPending } = usePackOrder();

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5">
      <h2 className="font-bold text-foreground">Pack this order</h2>
      <div className="flex items-center gap-4">
        <label className="text-sm font-semibold text-foreground">Bags</label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setBagCount((n) => Math.max(1, n - 1))} className="h-10 w-10 rounded-xl border border-border text-lg font-bold">
            −
          </button>
          <span className="w-8 text-center text-xl font-bold">{bagCount}</span>
          <button type="button" onClick={() => setBagCount((n) => Math.min(9, n + 1))} className="h-10 w-10 rounded-xl border border-border text-lg font-bold">
            +
          </button>
        </div>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-foreground">Rack label</span>
        <input
          value={rackLabel}
          onChange={(event) => setRackLabel(event.target.value)}
          placeholder="e.g. B-4"
          className="rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
      </label>
      <button
        type="button"
        disabled={isPending}
        onClick={() => pack({ orderId: order.id, bagCount, rackLabel })}
        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        Mark packed
      </button>
    </section>
  );
};

const AssignRiderSection = ({ order }) => {
  const [selected, setSelected] = useState(null);
  const { riders, isLoading } = useAvailableRiders(order.id);
  const { mutate: assign, isPending } = useAssignRider();

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5">
      <h2 className="font-bold text-foreground">Assign rider</h2>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading nearby riders…</p>
      ) : riders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No delivery partners online right now.</p>
      ) : (
        riders.map((rider) => (
          <label
            key={rider.id}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${
              selected === rider.id ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <input type="radio" name="rider" checked={selected === rider.id} onChange={() => setSelected(rider.id)} />
            <span className="flex flex-col">
              <span className="font-semibold">{rider.name}</span>
              <span className="text-xs text-muted-foreground">{rider.meta}</span>
            </span>
          </label>
        ))
      )}
      <button
        type="button"
        disabled={!selected || isPending}
        onClick={() => assign({ orderId: order.id, deliveryPartnerId: selected })}
        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        Assign rider
      </button>
    </section>
  );
};

const StoreOrderDetail = () => {
  const { orderId } = useParams();
  const { order, isLoading } = useStoreOrder(orderId);

  if (isLoading || !order) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const stage = deriveStage(order);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link to="/store" className="text-sm text-muted-foreground hover:text-foreground">
          Orders
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-bold text-foreground">#{order.order_number || order.id}</h1>
        <StageBadge stage={stage} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-5">
          {(stage === "NEW" || stage === "PICKING") && <PickSection order={order} />}
          {stage === "WAITING" && (
            <section className="rounded-2xl border border-border bg-white p-5 text-sm text-muted-foreground">
              Some items aren't available. The customer has been asked whether to accept the order without them —
              nothing to do here until they respond.
            </section>
          )}
          {stage === "PACKING" && <PackSection order={order} />}
          {stage === "READY" && <AssignRiderSection order={order} />}
          {stage === "ASSIGNED" && (
            <section className="rounded-2xl border border-border bg-white p-5 text-sm text-muted-foreground">
              Rider assigned — hand this order over from the <Link to="/store/handover" className="font-semibold text-primary">Handover</Link> tab.
            </section>
          )}
          {stage === "CANCELLED" && (
            <section className="rounded-2xl border border-border bg-white p-5 text-sm text-muted-foreground">
              This order is cancelled. If items were already picked, put them back on the shelf.
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-2xl border border-border bg-white p-4">
            <h2 className="mb-2 font-bold text-foreground">Customer</h2>
            <p className="text-sm font-semibold">{order.customer_name}</p>
            <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
          </section>

          {order.status_history?.length > 0 && (
            <section className="rounded-2xl border border-border bg-white p-4">
              <h2 className="mb-2 font-bold text-foreground">Timeline</h2>
              <ul className="flex flex-col gap-2">
                {order.status_history.map((entry, index) => (
                  <li key={index} className="flex justify-between text-sm">
                    <span>{entry.status}</span>
                    <span className="text-muted-foreground">{new Date(entry.created_at).toLocaleTimeString()}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
};

export default StoreOrderDetail;
