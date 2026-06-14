import { Edit2, Trash2,Tag } from "lucide-react";

const formatUnit = (variant) => {
  if (variant.unitType === "piece") return `${variant.value} pc`;
  if (variant.unitType === "pack") return `Pack of ${variant.value}`;
  return `${variant.value} ${variant.unit}`;
};

const VariantTable = ({ variants, onEdit, onDelete, onAssignPromotion }) => {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[#f8faf8]">
              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">Variant</th>
              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">Type</th>
              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">Price</th>
              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">MRP</th>
              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">Discount</th>
              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">Status</th>
              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">Stock</th>
              <th className="px-5 py-3.5 text-right font-medium text-[#6b7280] sm:px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => {
              const discount = variant.mrp > variant.price ? Math.round(((variant.mrp - variant.price) / variant.mrp) * 100) : 0;

              return (
                <tr key={variant.id} className="border-b border-[#e5e7eb] transition-colors last:border-0 hover:bg-[#f8faf8]">
                  <td className="px-5 py-4 font-medium text-[#1f2937] sm:px-6">{formatUnit(variant)}</td>
                  <td className="px-5 py-4 sm:px-6">
                    <span className="inline-flex rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-xs font-medium capitalize text-[#6b7280]">
                      {variant.unitType}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium text-[#1f2937] sm:px-6">₹{variant.price.toFixed(2)}</td>
                  <td className="px-5 py-4 text-[#6b7280] sm:px-6">₹{variant.mrp.toFixed(2)}</td>
                  <td className="px-5 py-4 sm:px-6">
                    {discount > 0 ? (
                      <span className="inline-flex rounded-full bg-[#0f5132]/10 px-2.5 py-0.5 text-xs font-medium text-[#0f5132]">
                        {discount}% off
                      </span>
                    ) : (
                      <span className="text-[#6b7280]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 sm:px-6">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        variant.status ? "bg-[#0f5132]/10 text-[#0f5132]" : "bg-[#f3f4f6] text-[#6b7280]"
                      }`}
                    >
                      {variant.status ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium sm:px-6">
                    <span className={variant.stock === 0 ? "text-red-600" : "text-[#1f2937]"}>
                      {variant.stock || 0}
                    </span>
                  </td>
                  <td className="px-5 py-4 sm:px-6">
                    <div className="flex items-center justify-end gap-1">
                       <button
                      type="button"
                      onClick={() => onAssignPromotion(variant.id)}
                      className="rounded-lg p-1.5 text-[#6b7280] transition-colors hover:bg-green-100 hover:text-green-700"
                      title="Assign Promotion"
                    >
                      <Tag className="h-4 w-4" />
                    </button>
                      <button
                        type="button"
                        onClick={() => onEdit(variant)}
                        className="rounded-lg p-1.5 text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1f2937]"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(variant.id)}
                        className="rounded-lg p-1.5 text-[#6b7280] transition-colors hover:bg-[#b8860b]/10 hover:text-[#8f6908]"
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
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-[#6b7280]">
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
