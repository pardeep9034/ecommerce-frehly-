import { Edit2, Trash2 } from "lucide-react";

const CategoryTable = ({ categories, onEdit, onDelete }) => {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Category</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Slug</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Image</th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Status</th>
              <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted">
                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    {category.image ? (
                      <img src={category.image} alt={category.name} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg">
                        📦
                      </div>
                    )}
                    <span className="font-medium text-foreground">{category.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-muted-foreground sm:px-6">{category.slug}</td>
                <td className="px-5 py-4 sm:px-6">
                  {category.image ? (
                    <span className="text-xs text-primary">Uploaded</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No image</span>
                  )}
                </td>
                <td className="px-5 py-4 sm:px-6">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      category.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {category.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-4 sm:px-6">
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
                      onClick={() => onDelete(category.id)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-warning/10 hover:text-warning-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryTable;
