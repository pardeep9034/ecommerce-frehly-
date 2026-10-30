import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import useInventory from "../../hooks/use-inventory";
import useStockMovement from "../../hooks/use-stockMovement";
import { useAdminProducts } from "../../hooks/use-product";
import { stockLevel } from "@/lib/stockLevel";
import { currentStaff } from "@/lib/warehouseAccess";
import { notify } from "@/lib/notify";
import StorePage, { BTN, CARD } from "../../components/store/StorePage";

// Reuses the existing InventoryApi.fetchInventoryByWarehouse / StockMovementApi
// (already in the codebase for the admin dashboard) instead of a new
// store-specific endpoint — see STORE_OPERATIONS_MODULE.md, "Stock" section.
// Response: data.inventory[] rows, each with variant { status, quantity, sku, product { name, status }, measurementUnit { code } }.
// Who may do what (agreed 2026-10-29, Task 200): the store manager adds catalog items (ACTIVE product + ACTIVE
// variant) to their own store and records movements; store staff only view. Nobody here removes an item or switches
// selling off: stock goes to 0, and only the super admin switches selling (shown as "Off by HQ").

const LEVEL = {
  OUT: ["Out of stock", "bg-[#FDECEA] text-[#B42318]"],
  LOW: ["Low stock", "bg-[#FEF4D6] text-[#7A5500]"],
  OK: ["In stock", "bg-[#E3F1E8] text-[#166434]"],
};
const FILTERS = [
  ["ALL", "All"],
  ["LOW", "Low"],
  ["OUT", "Out"],
];
// The design's three movements, mapped onto the inventory-service types. Stock in / Damaged
// take how many; Correct count takes the counted total (ADJUSTMENT needs after_stock).
const MOVES = [
  { type: "STOCK_IN", label: "Stock in", field: "Quantity added", next: (stock, qty) => stock + qty },
  { type: "DAMAGE", label: "Damaged", field: "Quantity damaged", next: (stock, qty) => stock - qty },
  { type: "ADJUSTMENT", label: "Correct count", field: "Counted on shelf", next: (_stock, qty) => qty },
];
// Web table: product · in stock · reserved · available · low at · status · adjust.
const STOCK_GRID = "lg:grid-cols-[minmax(0,2fr)_80px_80px_80px_70px_120px_64px]";
const INPUT = "h-12 w-full rounded-xl border-[1.5px] border-border bg-card px-3.5 text-[15px] outline-none focus:border-primary lg:h-11";

const nameOf = (item) => item.variant?.product?.name || `Variant #${item.variant_id}`;
// Pack size and SKU, e.g. "30 g · FR-82488CEA".
const variantLabel = ({ variant }) =>
  [variant?.quantity && `${variant.quantity} ${variant.measurementUnit?.code ?? ""}`.trim(), variant?.sku].filter(Boolean).join(" · ");
const time = (date) => (date ? new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "");
// The super admin switched the product or variant off: the shop hides it whatever the stock.
const offByHq = ({ variant }) => Boolean(variant) && (variant.status !== "ACTIVE" || variant.product?.status !== "ACTIVE");

// Pick an ACTIVE catalog variant this store doesn't carry yet; the opening count is logged as a Stock in.
const AddItemPanel = ({ carried, warehouseId, onDone }) => {
  const queryClient = useQueryClient();
  const { createInventory } = useInventory();
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState(null);
  const [opening, setOpening] = useState("0");
  const [lowAt, setLowAt] = useState("");
  const { products, isLoading } = useAdminProducts({ page: 1, limit: 20, status: "ACTIVE", search: search.trim() || undefined });
  const options = products.flatMap((product) =>
    (product.variants ?? [])
      .filter((variant) => variant.status === "ACTIVE" && !carried.has(Number(variant.id)))
      .map((variant) => ({ product, variant }))
  );
  const openingCount = Number(opening);
  const lowCount = Number(lowAt);
  const valid =
    picked && opening !== "" && Number.isInteger(openingCount) && openingCount >= 0 && (lowAt === "" || (Number.isInteger(lowCount) && lowCount >= 0));

  const save = () =>
    createInventory.mutate(
      {
        variant_id: picked.variant.id,
        warehouse_id: Number(warehouseId),
        opening_stock: openingCount,
        ...(lowAt !== "" && { low_stock_threshold: lowCount }),
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["stockMovements"] }); // the opening Stock in
          notify.success(`${picked.product.name} added to your store`);
          onDone();
        },
        onError: (error) => notify.apiError(error, "Could not add this item"),
      }
    );

  return (
    <section className={`${CARD} flex flex-col gap-3.5 p-4 lg:p-5`}>
      <h2 className="text-[15px] lg:text-base">Add an item</h2>
      <label className="flex h-12 items-center gap-2 rounded-xl bg-muted px-3.5 text-muted-foreground lg:h-10">
        <Search className="h-[18px] w-[18px] shrink-0" />
        <input
          aria-label="Search the catalog"
          placeholder="Search the catalog"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none lg:text-sm"
        />
      </label>
      <div role="radiogroup" aria-label="Item" className="flex max-h-64 flex-col overflow-y-auto rounded-xl border border-border">
        {isLoading ? (
          <p className="p-3 text-sm text-muted-foreground">Loading…</p>
        ) : options.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">No active items left to add{search.trim() ? " for this search" : ""}.</p>
        ) : (
          options.map(({ product, variant }) => (
            <label
              key={variant.id}
              className={`flex min-h-11 cursor-pointer items-center gap-3 border-t border-border px-3 py-2 first:border-t-0 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40 ${
                picked?.variant.id === variant.id ? "bg-[#E3F1E8]" : ""
              }`}
            >
              <input type="radio" name="add-item" checked={picked?.variant.id === variant.id} onChange={() => setPicked({ product, variant })} className="accent-primary" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">{product.name}</span>
                <span className="truncate text-xs text-muted-foreground">{[variant.quantity, variant.sku].filter(Boolean).join(" · ")}</span>
              </span>
              <span className="shrink-0 text-sm">₹{variant.price}</span>
            </label>
          ))
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Opening count
          <input type="number" min="0" step="1" inputMode="numeric" value={opening} onChange={(event) => setOpening(event.target.value)} className={INPUT} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Low stock at
          <input type="number" min="0" step="1" inputMode="numeric" placeholder="10" value={lowAt} onChange={(event) => setLowAt(event.target.value)} className={`${INPUT} font-normal`} />
        </label>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onDone} className={`${BTN.secondary} flex-1`}>
          Cancel
        </button>
        <button type="button" disabled={!valid || createInventory.isPending} onClick={save} className={`${BTN.primary} flex-[2]`}>
          Add to store
        </button>
      </div>
    </section>
  );
};

const AdjustPanel = ({ item, warehouseId, onDone }) => {
  const queryClient = useQueryClient();
  const { createMutation } = useStockMovement();
  const [move, setMove] = useState(MOVES[0]);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const stock = Number(item.current_stock ?? 0);
  const qty = Number(quantity);
  const next = move.next(stock, qty);
  const valid =
    quantity !== "" && Number.isInteger(qty) && qty >= 0 && next >= 0 && (move.type === "ADJUSTMENT" ? next !== stock : qty > 0);

  const save = () =>
    createMutation.mutate(
      {
        variant_id: item.variant_id,
        warehouse_id: warehouseId,
        movement_type: move.type,
        quantity: move.type === "ADJUSTMENT" ? Math.abs(next - stock) : qty,
        ...(move.type === "ADJUSTMENT" && { after_stock: next }),
        reason: reason.trim(),
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["inventory"] }); // the hook only refreshes movements
          onDone();
        },
      }
    );

  return (
    <section className={`${CARD} flex flex-col gap-3.5 p-4 lg:p-5`}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[15px] lg:text-base">Update {nameOf(item)}</h2>
        <span className="shrink-0 text-[13px] text-muted-foreground">{stock} in stock</span>
      </div>
      <div role="radiogroup" aria-label="Movement" className="grid grid-cols-3 gap-2">
        {MOVES.map((option) => (
          <label
            key={option.type}
            className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border-[1.5px] px-1 text-center text-[13px] font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40 ${
              move.type === option.type ? "border-primary bg-[#E3F1E8] text-primary" : "border-border bg-card text-foreground"
            }`}
          >
            <input type="radio" name="movement" checked={move.type === option.type} onChange={() => setMove(option)} className="sr-only" />
            {option.label}
          </label>
        ))}
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {move.field}
        <input type="number" min="0" step="1" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} className={INPUT} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Reason
        <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Morning supplier delivery" className={`${INPUT} font-normal`} />
      </label>
      <p className="text-sm text-muted-foreground">
        {stock} → <strong className={next < 0 ? "text-[#B42318]" : "text-foreground"}>{quantity === "" ? "—" : next}</strong>
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={onDone} className={`${BTN.secondary} flex-1`}>
          Cancel
        </button>
        <button type="button" disabled={!valid || createMutation.isPending} onClick={save} className={`${BTN.primary} flex-[2]`}>
          {valid ? `Save · ${next}` : "Save movement"}
        </button>
      </div>
    </section>
  );
};

const StoreStock = () => {
  const { staff } = useOutletContext();
  const warehouseId = staff?.warehouse_id;
  const { inventory, isLoading } = useInventory(1, 100, warehouseId);
  const { stockMovements } = useStockMovement(1, 5, { warehouse_id: warehouseId });
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const { role, isSuperAdmin } = currentStaff();
  const managesStock = isSuperAdmin || role === "ADMIN";
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const panelRef = useRef(null);

  // Phones stack the panel under the list; bring it into view when a row is picked.
  useEffect(() => {
    if (selected || adding) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selected, adding]);

  const items = inventory?.data?.inventory ?? [];
  const counts = { ALL: items.length, LOW: 0, OUT: 0 };
  items.forEach((item) => {
    const level = stockLevel(item);
    if (level !== "OK") counts[level] += 1;
  });
  const query = search.trim().toLowerCase();
  const shown = items.filter(
    (item) => (filter === "ALL" || stockLevel(item) === filter) && (!query || nameOf(item).toLowerCase().includes(query))
  );
  // Until the warehouse id loads the query runs unfiltered; don't show another store's rows.
  const movements = (warehouseId && stockMovements?.data?.stockMovements) || [];
  const nameById = Object.fromEntries(items.map((item) => [item.variant_id, nameOf(item)]));

  return (
    <StorePage
      title="Stock"
      subtitle={staff?.warehouse_name || "Your store"}
      badge={
        managesStock &&
        warehouseId && (
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setAdding(true);
            }}
            className={`${BTN.secondary} h-11 shrink-0 px-3.5`}
          >
            <Plus className="h-[18px] w-[18px]" />
            Add item
          </button>
        )
      }
    >
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-5">
        <section className={`${CARD} overflow-hidden`}>
          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center lg:px-5">
            <label className="flex h-12 flex-1 items-center gap-2 rounded-xl bg-muted px-3.5 text-muted-foreground lg:h-10">
              <Search className="h-[18px] w-[18px] shrink-0" />
              <input
                aria-label="Search products"
                placeholder="Search product"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none lg:text-sm"
              />
            </label>
            <div className="flex gap-2">
              {FILTERS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                  className={`h-10 flex-1 rounded-full px-3.5 text-[13px] font-semibold sm:flex-none ${
                    filter === key ? "bg-primary text-white" : "border border-border bg-card text-foreground"
                  }`}
                >
                  {label} · {counts[key]}
                </button>
              ))}
            </div>
          </div>

          {isLoading || !staff ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">Loading…</p>
          ) : shown.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">
              {items.length === 0 ? "No stock records for this warehouse yet." : "Nothing matches this filter."}
            </p>
          ) : (
            <>
              <div aria-hidden="true" className={`hidden gap-x-3 bg-muted px-5 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid ${STOCK_GRID}`}>
                <span>Product</span>
                <span className="text-right">In stock</span>
                <span className="text-right">Reserved</span>
                <span className="text-right">Available</span>
                <span className="text-right">Low at</span>
                <span>Status</span>
                <span />
              </div>
              <ul>
                {shown.map((item) => {
                  const available = (item.current_stock ?? 0) - (item.reserved_stock ?? 0);
                  const [levelLabel, levelTone] = LEVEL[stockLevel(item)];
                  return (
                    <li
                      key={item.id}
                      className={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 border-t border-border px-4 py-3 lg:px-5 ${STOCK_GRID} ${
                        selected?.id === item.id ? "bg-[#F3F9F5]" : ""
                      }`}
                    >
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate text-sm font-semibold">{nameOf(item)}</span>
                          {offByHq(item) && (
                            <span
                              title="The super admin has switched selling off; the shop hides it"
                              className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
                            >
                              Off by HQ
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground lg:hidden">
                          {levelLabel} · {item.reserved_stock ?? 0} reserved
                        </span>
                        {variantLabel(item) && <span className="hidden text-xs text-muted-foreground lg:block">{variantLabel(item)}</span>}
                      </span>
                      <span className="hidden text-right text-sm lg:block">{item.current_stock ?? 0}</span>
                      <span className="hidden text-right text-sm text-muted-foreground lg:block">{item.reserved_stock ?? 0}</span>
                      <span className="text-right font-display text-lg font-bold lg:font-sans lg:text-sm">{available}</span>
                      <span className="hidden text-right text-sm text-muted-foreground lg:block">{item.low_stock_threshold ?? 10}</span>
                      <span className="hidden lg:block">
                        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${levelTone}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {levelLabel}
                        </span>
                      </span>
                      {managesStock ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAdding(false);
                            setSelected(item);
                          }}
                          className="min-h-11 px-1 text-right text-sm font-semibold text-primary"
                        >
                          Adjust
                        </button>
                      ) : (
                        <span />
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        <aside ref={panelRef} className="flex scroll-mt-20 flex-col gap-3 lg:sticky lg:top-24 lg:gap-5">
          {!managesStock ? (
            <p className={`${CARD} p-4 text-sm text-muted-foreground lg:p-5`}>View only · your store manager records stock in, damage and recounts.</p>
          ) : adding ? (
            <AddItemPanel carried={new Set(items.map((item) => Number(item.variant_id)))} warehouseId={warehouseId} onDone={() => setAdding(false)} />
          ) : selected ? (
            <AdjustPanel key={selected.id} item={selected} warehouseId={warehouseId} onDone={() => setSelected(null)} />
          ) : (
            <p className={`${CARD} hidden p-5 text-sm text-muted-foreground lg:block`}>Pick Adjust on a row to record stock in, damage or a recount, or Add item to stock something new.</p>
          )}
          {movements.length > 0 && (
            <section className={`${CARD} flex flex-col gap-2 p-4 lg:p-5`}>
              <h2 className="text-[15px] lg:text-base">Recent movements</h2>
              <ul>
                {movements.map((movement) => {
                  const delta = (movement.after_stock ?? 0) - (movement.before_stock ?? 0);
                  return (
                    <li key={movement.id} className="flex items-center gap-3 border-t border-border py-2.5 first:border-t-0">
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-sm font-semibold">
                          {movement.movement_type.charAt(0) + movement.movement_type.slice(1).toLowerCase().replace(/_/g, " ")} ·{" "}
                          {nameById[movement.variant_id] || `Variant #${movement.variant_id}`}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {[time(movement.created_at), movement.reason].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <span className={`font-display text-sm font-bold ${delta < 0 ? "text-[#B42318]" : "text-primary"}`}>
                        {delta > 0 ? `+${delta}` : delta === 0 ? "0" : `−${-delta}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </StorePage>
  );
};

export default StoreStock;
