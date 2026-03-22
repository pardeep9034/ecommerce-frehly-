import { Edit2, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProductTable = ({ products, onEdit, onDelete }) => {
  const navigate = useNavigate();
  console.log("products", products);

  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[#f8faf8]">
              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">Product</th>
              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">Category</th>
              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">Variants</th>
              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">Status</th>
              <th className="px-5 py-3.5 text-right font-medium text-[#6b7280] sm:px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-[#e5e7eb] transition-colors last:border-0 hover:bg-[#f8faf8]">
                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f3f4f6] text-lg">
                      {product.emoji || "🛒"}
                    </div>
                    <span className="font-medium text-[#1f2937]">{product.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-[#6b7280] sm:px-6">{product?.Category?.name}</td>
                <td className="px-5 py-4 sm:px-6">
                  <span className="text-[#1f2937]">
                    {product.variants?.length || 0} variants
                  </span>
                </td>
                <td className="px-5 py-4 sm:px-6">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${product.status ? "bg-[#0f5132]/10 text-[#0f5132]" : "bg-[#f3f4f6] text-[#6b7280]"
                      }`}
                  >
                    {product.status ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/products/${product.id}`)}
                      className="rounded-lg p-1.5 text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1f2937]"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      className="rounded-lg p-1.5 text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1f2937]"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(product.id)}
                      className="rounded-lg p-1.5 text-[#6b7280] transition-colors hover:bg-[#b8860b]/10 hover:text-[#8f6908]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-[#6b7280]">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;
