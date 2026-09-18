import { Edit2, Eye, Trash2 } from "lucide-react";

const formatUnit = (variant) => {
  const measurementUnit = variant.measurementUnit;
  return `${variant.quantity} ${measurementUnit?.code}`;
};

const VariantTable = ({ variants, onEdit, onDelete, onViewStock }) => {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Id</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Variant</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Type</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Price</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">MRP</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Discount</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Status</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Stock</th>
              <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => {
              const discount = variant.mrp > variant.price ? Math.round(((variant.mrp - variant.price) / variant.mrp) * 100) : 0;

              return (
                <tr key={variant.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted">
                  <td className="px-5 py-4 font-medium text-foreground sm:px-6">{variant.id}</td>
                  <td className="px-5 py-4 font-medium text-foreground sm:px-6">{formatUnit(variant)}</td>
                  <td className="px-5 py-4 sm:px-6">
                    <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                      {variant.measurementUnit.category}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium text-foreground sm:px-6">₹{variant.price.toFixed(2)}</td>
                  <td className="px-5 py-4 text-muted-foreground sm:px-6">₹{variant.mrp.toFixed(2)}</td>
                  <td className="px-5 py-4 sm:px-6">
                    {discount > 0 ? (
                      <span className="inline-flex rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                        {discount}% off
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 sm:px-6">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        variant.status ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {variant?.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium sm:px-6">
                    <div className="flex items-center gap-2">
                    
                      <button
                        type="button"
                        onClick={() => onViewStock?.(variant.id)}
                        className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        title="View stock by warehouse"
                        aria-label={`View stock for variant ${variant.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4 sm:px-6">
                    <div className="flex items-center justify-end gap-1">
                       {/* <button
                      type="button"
                      onClick={() => onAssignPromotion(variant.id)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-success hover:text-success"
                      title="Assign Promotion"
                    >
                      <Tag className="h-4 w-4" />
                    </button> */}
                      <button
                        type="button"
                        onClick={() => onEdit(variant)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(variant.id)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-warning/10 hover:text-warning-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {variants.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No variants added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VariantTable;
