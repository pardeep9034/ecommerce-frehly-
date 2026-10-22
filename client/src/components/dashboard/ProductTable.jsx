import { Edit2, Trash2, Eye, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";

const initials = (name = "") =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

const STATUS_BADGE = {
  ACTIVE: "bg-success/10 text-success",
  DRAFT: "bg-muted text-muted-foreground",
  INACTIVE: "bg-amber/10 text-amber",
  ARCHIVED: "bg-muted text-foreground",
};

const ProductTable = ({ products, categoriesById = {}, brandsById = {}, productTypesById = {}, onEdit, onDelete }) => {
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Product</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Type</th>
              <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Variants</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Organic</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Status</th>
              <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const category = product.category?.name || product.Category?.name || categoriesById[product.category_id]?.name;
              const brand = product.brand?.name || brandsById[product.brand_id]?.name;
              const type = product.productType?.name || productTypesById[product.product_type_id]?.name;
              const variantCount = product.variants?.length ?? product.variantIds?.length ?? 0;

              return (
                <tr key={product.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted">
                  <td className="px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-primary">
                        {initials(product.name) || "?"}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[category, brand].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground sm:px-6">{type || "—"}</td>
                  <td className="px-5 py-4 text-right text-foreground sm:px-6">{variantCount}</td>
                  <td className="px-5 py-4 sm:px-6">
                    {product.is_organic ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                        <Leaf className="h-3 w-3" />
                        Organic
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 sm:px-6">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[product.status] || "bg-muted text-muted-foreground"}`}>
                      {product.status?.toLowerCase() || "unknown"}
                    </span>
                  </td>
                  <td className="px-5 py-4 sm:px-6">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/products/${product.id}`)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(product.id)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-warning/10 hover:text-warning-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
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
