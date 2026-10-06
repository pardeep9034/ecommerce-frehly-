const TYPE_STYLES = {
  STOCK_IN: "bg-success/10 text-success",
  SALE: "bg-blue-50 text-blue-600",
  ADJUSTMENT: "bg-violet-50 text-violet-600",
  DAMAGE: "bg-destructive/10 text-destructive",
  RETURN: "bg-amber-50 text-amber-600",
};

const TYPE_LABELS = {
  STOCK_IN: "Stock in",
  SALE: "Sale",
  ADJUSTMENT: "Adjustment",
  DAMAGE: "Damage",
  RETURN: "Return",
};

const INCREASE_TYPES = new Set(["STOCK_IN", "RETURN"]);

const MovementTable = ({ movements = [], variantNames = {}, warehouseNames = {}, isLoading }) => {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted text-left">
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">When</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Variant</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Warehouse</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Type</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Qty</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Stock</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Reason</th>
            </tr>
          </thead>

          <tbody>
            {movements.map((movement) => {
              const isIncrease = INCREASE_TYPES.has(movement.movement_type);
              return (
                <tr key={movement.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted">
                  <td className="px-5 py-4 text-muted-foreground sm:px-6">
                    {new Date(movement.created_at).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-5 py-4 font-medium text-foreground sm:px-6">
                    {variantNames[movement.variant_id] || `Variant #${movement.variant_id}`}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground sm:px-6">
                    {warehouseNames[movement.warehouse_id] || `#${movement.warehouse_id}`}
                  </td>
                  <td className="px-5 py-4 sm:px-6">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[movement.movement_type] || "bg-gray-100 text-gray-600"}`}>
                      {TYPE_LABELS[movement.movement_type] || movement.movement_type}
                    </span>
                  </td>
                  <td className={`px-5 py-4 font-medium sm:px-6 ${isIncrease ? "text-success" : "text-destructive"}`}>
                    {isIncrease ? "+" : "-"}
                    {movement.quantity}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground sm:px-6">
                    {movement.before_stock} → {movement.after_stock}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground sm:px-6">{movement.reason || "—"}</td>
                </tr>
              );
            })}

            {movements.length === 0 && !isLoading && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No movements found.
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  Loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MovementTable;
