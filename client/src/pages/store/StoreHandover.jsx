import { useState } from "react";
import { useStoreHandovers, useConfirmHandover } from "../../hooks/use-store";

const HandoverCard = ({ order }) => {
  const [code, setCode] = useState("");
  const { mutate: confirm, isPending, error } = useConfirmHandover();

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="font-bold text-foreground">#{order.order_number || order.id}</span>
        <span className="text-xs font-semibold text-muted-foreground">{order.rider_status || "Rider assigned"}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-sm font-bold text-success">
          {(order.rider_name || "R").slice(0, 2).toUpperCase()}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{order.rider_name || "Rider"}</span>
          <span className="text-xs text-muted-foreground">{order.rack_label ? `Rack ${order.rack_label}` : "No rack set"}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Rider's pickup code"
          className="flex-grow rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          disabled={!code.trim() || isPending}
          onClick={() => confirm({ orderId: order.id, pickupCode: code.trim() })}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          Hand over
        </button>
      </div>
      {error && <p className="text-xs font-semibold text-destructive">{error.response?.data?.message || "Couldn't confirm handover."}</p>}
    </section>
  );
};

const StoreHandover = () => {
  const { handovers, isLoading } = useStoreHandovers();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Handover</h1>
        <p className="text-sm text-muted-foreground">Match the rider's pickup code before handing over</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : handovers.length === 0 ? (
        <p className="rounded-2xl border border-border bg-white p-5 text-sm text-muted-foreground">
          No riders waiting at the store right now.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {handovers.map((order) => (
            <HandoverCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

export default StoreHandover;
