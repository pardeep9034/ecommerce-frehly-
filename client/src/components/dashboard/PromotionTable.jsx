import { Pencil, Trash2, Flame, Star, Tag, CheckCircle2, XCircle, PackageSearch } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TYPE_STYLES = {
  HOT: "bg-orange-100 text-orange-700 border border-orange-200",
  POPULAR: "bg-blue-100 text-blue-700 border border-blue-200",
  DISCOUNT: "bg-purple-100 text-purple-700 border border-purple-200",
};

const TYPE_ICONS = {
  HOT: Flame,
  POPULAR: Star,
  DISCOUNT: Tag,
};

const PromotionTable = ({ promotions = [], onEdit, onDelete }) => {
  const navigate = useNavigate();
  if (!promotions.length) {
    return (
      <div className="rounded-xl border border-border bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Tag className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">No promotions found</p>
        <p className="mt-1 text-xs text-muted-foreground">Create your first promotion to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted text-left">
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Discount</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start Date</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">End Date</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-muted">
            {promotions.map((promo) => {
              const TypeIcon = TYPE_ICONS[promo.type] || Tag;
              const discountLabel =
                promo.discountType && promo.discountValue != null
                  ? promo.discountType === "PERCENT"
                    ? `${promo.discountValue}%`
                    : `₹${promo.discountValue}`
                  : "—";
              const startDate = promo.startDate
                ? new Date(promo.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : "—";
              const endDate = promo.endDate
                ? new Date(promo.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : "—";

              return (
                <tr key={promo.id} className="group transition-colors hover:bg-muted">
                  <td className="px-5 py-4">
                    <span className="font-semibold text-foreground">{promo.title || "—"}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${TYPE_STYLES[promo.type] || "bg-gray-100 text-gray-600"}`}>
                      <TypeIcon className="h-3 w-3" />
                      {promo.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium text-foreground">{discountLabel}</td>
                  <td className="px-5 py-4 text-muted-foreground">{startDate}</td>
                  <td className="px-5 py-4 text-muted-foreground">{endDate}</td>
                  <td className="px-5 py-4">
                    {promo.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-[11px] font-bold text-success border border-success">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-bold text-destructive border border-destructive">
                        <XCircle className="h-3 w-3" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{promo.priority ?? "—"}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => navigate(`/dashboard/promotions/${promo.id}/items`)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground shadow-sm transition-colors hover:border-blue-500 hover:bg-blue-500 hover:text-white"
                        title="Manage Items"
                      >
                        <PackageSearch className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(promo)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground shadow-sm transition-colors hover:border-primary hover:bg-primary hover:text-white"
                        title="Edit Promo"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(promo.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground shadow-sm transition-colors hover:border-destructive hover:bg-destructive hover:text-white"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PromotionTable;
