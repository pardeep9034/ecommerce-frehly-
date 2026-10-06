import { Edit2, Trash2 } from "lucide-react";
import { Fragment, useState } from "react";
import ConfirmationModal from "@/components/common/ConfirmationModal";

const initials = (name = "") =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

const CategoryRow = ({ category, indent, onEdit, onDelete, selectedId }) => (
  <tr
    className={`border-b border-border transition-colors last:border-0 hover:bg-muted ${
      selectedId === category.id ? "bg-secondary" : ""
    }`}
  >
    <td className="px-5 py-3.5 sm:px-6">
      <div className="flex items-center gap-2" style={indent ? { paddingLeft: 28 } : undefined}>
        {indent && <span className="text-muted-foreground">{"└"}</span>}
        {category.image_url ? (
          <img src={category.image_url} alt="" className="h-8 w-8 shrink-0 rounded-lg border border-border object-cover" />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-primary">
            {initials(category.name) || "?"}
          </span>
        )}
        <span className={indent ? "font-medium text-foreground" : "font-semibold text-foreground"}>{category.name}</span>
      </div>
    </td>
    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground sm:px-6">{category.slug}</td>
    <td className="px-5 py-3.5 text-right text-muted-foreground sm:px-6">{category.sort_order ?? 0}</td>
    <td className="px-5 py-3.5 text-right text-foreground sm:px-6">{Number(category.productCount) || 0}</td>
    <td className="px-5 py-3.5 sm:px-6">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          category.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${category.is_active ? "bg-success" : "bg-muted-foreground"}`} />
        {category.is_active ? "Active" : "Inactive"}
      </span>
    </td>
    <td className="px-5 py-3.5 sm:px-6">
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => onEdit(category)}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(category)}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </td>
  </tr>
);

// `roots`: tree mode (each item's own `children` array is rendered indented beneath it) — used when there's no search.
// `flat`: flat mode (no indentation) — used for search results, so a matching child surfaces even if its parent didn't match.
const CategoryTable = ({ roots, flat, onEdit, onDelete, selectedId }) => {
  const [deleteCategory, setDeleteCategory] = useState(null);
  const isEmpty = flat ? flat.length === 0 : (roots || []).length === 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Category</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Slug</th>
              <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Sort</th>
              <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Products</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Status</th>
              <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {flat
              ? flat.map((category) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    onEdit={onEdit}
                    onDelete={setDeleteCategory}
                    selectedId={selectedId}
                  />
                ))
              : (roots || []).map((root) => (
                  <Fragment key={root.id}>
                    <CategoryRow category={root} onEdit={onEdit} onDelete={setDeleteCategory} selectedId={selectedId} />
                    {(root.children || []).map((child) => (
                      <CategoryRow
                        key={child.id}
                        category={child}
                        indent
                        onEdit={onEdit}
                        onDelete={setDeleteCategory}
                        selectedId={selectedId}
                      />
                    ))}
                  </Fragment>
                ))}

            {isEmpty && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No categories found.
                </td>
              </tr>
            )}

            <ConfirmationModal
              open={Boolean(deleteCategory)}
              title="Are you sure you want to delete this category?"
              cancelBtnName="Cancel"
              proceedBtnName="Delete"
              onSuccess={() => {
                onDelete(deleteCategory.id);
                setDeleteCategory(null);
              }}
              onClose={() => setDeleteCategory(null)}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryTable;
