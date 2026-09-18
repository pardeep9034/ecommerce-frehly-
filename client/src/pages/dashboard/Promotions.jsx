import { useState } from "react";
import { Plus, Search, Tag } from "lucide-react";
import PromotionTable from "@/components/dashboard/PromotionTable";
import PromotionModal from "@/components/dashboard/PromotionModal";
import usePromotion from "@/hooks/use-promotion";
const TYPE_FILTERS = ["All", "HOT", "POPULAR", "DISCOUNT"];

const Promotions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
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
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-muted-foreground">
        Loading promotions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-10 text-destructive">
        Failed to load promotions.
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

          {/* Right: Add button */}
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Promotion
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: promotionsList.length, color: "text-foreground" },
          { label: "Active", value: promotionsList.filter((p) => p.isActive).length, color: "text-success" },
          { label: "HOT Deals", value: promotionsList.filter((p) => p.type === "HOT").length, color: "text-orange-600" },
          { label: "Discounts", value: promotionsList.filter((p) => p.type === "DISCOUNT").length, color: "text-purple-600" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground">{stat.label}</p>
            <p className={`mt-1 text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <PromotionTable
        promotions={filteredPromotions}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      {/* Pagination */}
      {totalPages > 1 && (
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
