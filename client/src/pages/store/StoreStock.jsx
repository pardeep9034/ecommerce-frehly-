import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import useInventory from "../../hooks/use-inventory";
import useStockMovement from "../../hooks/use-stockMovement";

// Reuses the existing InventoryApi.fetchInventoryByWarehouse / StockMovementApi
// (already in the codebase for the admin dashboard) instead of a new
// store-specific endpoint — see STORE_OPERATIONS_MODULE.md, "Stock" section.
// That warehouse-scoped inventory response has never actually been rendered
// anywhere yet, so field names below are best-effort against Inventory.model.js
// and need confirming once a real warehouse_id is wired through.
const StoreStock = () => {
  const { staff } = useOutletContext();
  const warehouseId = staff?.warehouse_id;
  const { inventory, isLoading } = useInventory(1, 100, warehouseId);
  const { createMutation } = useStockMovement();
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("");

  const items = inventory?.data?.items || inventory?.data || [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Stock</h1>
        <p className="text-sm text-muted-foreground">{staff?.warehouse_name || "Your store"}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="overflow-hidden rounded-2xl border border-border bg-white">
          {isLoading ? (
            <p className="p-5 text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No stock records for this warehouse yet.</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2 text-right">In stock</th>
                  <th className="px-4 py-2 text-right">Reserved</th>
                  <th className="px-4 py-2 text-right">Available</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const available = (item.current_stock ?? 0) - (item.reserved_stock ?? 0);
                  const isOut = available <= 0;
                  const isLow = !isOut && available <= (item.low_stock_threshold ?? 10);
                  return (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-4 py-3 font-semibold">{item.product_name || item.variant_name || `Variant #${item.variant_id}`}</td>
                      <td className="px-4 py-3 text-right">{item.current_stock}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{item.reserved_stock}</td>
                      <td className="px-4 py-3 text-right font-semibold">{available}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isOut ? "bg-destructive/10 text-destructive" : isLow ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                          }`}
                        >
                          {isOut ? "Out of stock" : isLow ? "Low stock" : "In stock"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(item);
                            setQuantity(0);
                            setReason("");
                          }}
                          className="text-sm font-semibold text-primary"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <aside className="rounded-2xl border border-border bg-white p-5">
          {!selected ? (
            <p className="text-sm text-muted-foreground">Select a row to adjust its stock.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <h2 className="font-bold text-foreground">Adjust · {selected.product_name || selected.variant_name}</h2>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Quantity change</span>
                <input
                  type="number"
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  className="rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Reason</span>
                <input
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="e.g. Damaged batch"
                  className="rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>
              <button
                type="button"
                disabled={createMutation.isPending || quantity === 0}
                onClick={() =>
                  createMutation.mutate(
                    {
                      variant_id: selected.variant_id,
                      warehouse_id: warehouseId,
                      quantity,
                      reason,
                      movement_type: quantity > 0 ? "STOCK_IN" : "ADJUSTMENT",
                    },
                    { onSuccess: () => setSelected(null) }
                  )
                }
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                Save movement
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default StoreStock;
