import { Edit2, Trash2 } from "lucide-react";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { useState } from "react";

const initials = (name = "") =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

const BrandTable = ({ brands = [], onEdit, onDelete, isLoading, selectedId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteBrand, setDeleteBrand] = useState(null);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Brand</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Status</th>
              <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Actions</th>
            </tr>
          </thead>

          <tbody>
            {brands.map((brand) => (
              <tr
                key={brand.id}
                className={`border-b border-border transition-colors last:border-0 hover:bg-muted ${
                  selectedId === brand.id ? "bg-secondary" : ""
                }`}
              >
                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    {brand.logo_url ? (
                      <img src={brand.logo_url} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-border object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-xs font-bold text-accent-foreground">
                        {initials(brand.name) || "?"}
                      </span>
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{brand.name}</span>
                      {brand.description && (
                        <span className="text-xs text-muted-foreground">{brand.description}</span>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4 sm:px-6">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      brand.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${brand.is_active ? "bg-success" : "bg-muted-foreground"}`} />
                    {brand.is_active ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit?.(brand)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeleteBrand(brand);
                        setIsOpen(true);
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {brands.length === 0 && !isLoading && (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No brands found.
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  Loading ....
                </td>
              </tr>
            )}
            <ConfirmationModal
              open={isOpen}
              title={"are you sure to delete this"}
              cancelBtnName={"Cancel"}
              proceedBtnName={"Delete"}
              onSuccess={() => {
                onDelete?.(deleteBrand.id);
                setIsOpen(false);
                setDeleteBrand(null);
              }}
              onClose={() => setIsOpen(false)}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BrandTable;
