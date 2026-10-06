import { useMemo, useState } from "react";
import { Plus, Search, Tag } from "lucide-react";
import PromotionTable from "@/components/dashboard/PromotionTable";
import PromotionModal from "@/components/dashboard/PromotionModal";
import TableSkeleton from "@/components/dashboard/TableSkeleton";
import PageHeader from "@/components/dashboard/PageHeader";
import usePromotion from "@/hooks/use-promotion";
const TYPE_FILTERS = ["All", "HOT", "POPULAR", "DISCOUNT"];
const STATUS_FILTERS = ["All", "Live", "Scheduled", "Ended"];

// A promotion has no stored "status" field — Live/Scheduled/Ended is derived
// from isActive + startDate/endDate, same fields the table already shows.
const getPromoStatus = (promo) => {
  const now = Date.now();
  const start = promo.startDate ? new Date(promo.startDate).getTime() : null;
  const end = promo.endDate ? new Date(promo.endDate).getTime() : null;
  if (!promo.isActive || (end && end < now)) return "Ended";
  if (start && start > now) return "Scheduled";
  return "Live";
};

const Promotions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);

  const pageSize = 8;

  const {
    promotions: promotionsData,
    isLoading,
    error,
    createPromotion: createMutation,
    updatePromotion: updateMutation,
    deletePromotion: deleteMutation,
  } = usePromotion(currentPage, pageSize, typeFilter === "All" ? null : typeFilter);

  const promotionsList =
    promotionsData?.data?.promotions ||
    promotionsData?.data ||
    promotionsData?.promotions ||
    [];

  const pagination =
    promotionsData?.data?.pagination || promotionsData?.pagination || {};

  const totalPages = pagination.totalPages || 1;

  const filteredPromotions = promotionsList.filter((p) => {
    const title = p.title || "";
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || getPromoStatus(p) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const liveCount = promotionsList.filter((p) => getPromoStatus(p) === "Live").length;
  const scheduledPromos = promotionsList.filter((p) => getPromoStatus(p) === "Scheduled");
  const nextScheduled = scheduledPromos
    .slice()
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];

  const openAddModal = () => {
    setEditingPromotion(null);
    setIsModalOpen(true);
  };

  const openEditModal = (promotion) => {
    setEditingPromotion(promotion);
    setIsModalOpen(true);
  };

  const handleSave = (payload) => {
    if (editingPromotion) {
      updateMutation.mutate({ id: editingPromotion.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
    setIsModalOpen(false);
    setEditingPromotion(null);
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const setPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center p-10 text-destructive">
        Failed to load promotions.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotions"
        description="Create and manage discounts and campaigns."
        action={
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Promotion
          </button>
        }
      />

      {/* Header bar */}
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          {/* Left: Search + Type filter */}
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
            {/* Search */}
            <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search promotions..."
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="min-w-[150px] rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            >
              {TYPE_FILTERS.map((t) => (
                <option key={t} value={t}>
                  {t === "All" ? "All Types" : t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`h-9 rounded-full px-3 text-xs font-semibold transition-colors ${
                  statusFilter === status ? "bg-primary text-white" : "border border-border bg-white text-foreground hover:bg-muted"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Live now", value: liveCount, hint: "Currently active", color: "text-success" },
          {
            label: "Scheduled",
            value: scheduledPromos.length,
            hint: nextScheduled ? `Starts ${new Date(nextScheduled.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}` : "—",
            color: "text-blue-600",
          },
          // No order↔promotion attribution exists yet — these two are the
          // design's own sample figures, not computed from real orders.
          { label: "Orders with a promo", value: "38%", hint: "Today · demo figure", color: "text-purple-600" },
          { label: "Discount given today", value: "₹6,120", hint: "10.5% of revenue · demo figure", color: "text-orange-600" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground">{stat.label}</p>
            {isLoading ? (
              <div className="mt-1.5 h-6 w-10 rounded skeleton-shimmer" />
            ) : (
              <p className={`mt-1 text-2xl font-black ${stat.color}`}>{stat.value}</p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.hint}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={pageSize} columns={5} />
      ) : (
        <PromotionTable
          promotions={filteredPromotions}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 sm:flex-row sm:items-center sm:px-5">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
            {pagination.totalItems ? ` (${pagination.totalItems} total)` : ""}
          </p>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setPage(page)}
                className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <PromotionModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPromotion(null);
        }}
        promotion={editingPromotion}
        onSave={handleSave}
      />
    </div>
  );
};

export default Promotions;
