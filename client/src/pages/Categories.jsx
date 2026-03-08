import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import CategoryTable from "@/components/freshly/CategoryTable";
import CategoryModal from "@/components/freshly/CategoryModal";
import useCategory from "@/hooks/use-category";

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const pageSize = 5;

  const {
    categories: categoriesData,
    isLoading,
    error,
    createCategory: createMutation,
    updateCategory: updateMutation,
    deleteCategory: deleteMutation,
  } = useCategory(currentPage, pageSize);

  const categoriesList = categoriesData?.data?.categories || [];
  const pagination = categoriesData?.data?.pagination || {};

  const filteredCategories = useMemo(() => {
    return categoriesList.filter((category) => {
      const searchMatch =
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.slug && category.slug.toLowerCase().includes(searchTerm.toLowerCase()));
      const statusMatch =
        statusFilter === "All" ||
        (statusFilter === "Active" && category.status) ||
        (statusFilter === "Inactive" && !category.status);
      return searchMatch && statusMatch;
    });
  }, [categoriesList, searchTerm, statusFilter]);

  const totalPages = pagination.totalPages || 1;

  const openAddModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const saveCategory = (payload) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleDelete = (categoryId) => {
    deleteMutation.mutate(categoryId);
  };

  const setPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-10 text-[#6b7280]">Loading categories...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center p-10 text-red-500">Failed to load categories.</div>;
  }

  return (
    <div className="space-y-6 lg:space-y-7">
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
            <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2.5">
              <Search className="h-4 w-4 text-[#6b7280]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search categories..."
                className="w-full bg-transparent text-sm text-[#1f2937] outline-none placeholder:text-[#6b7280]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="min-w-[150px] rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f5132] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0b4128]"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>
      </div>

      <CategoryTable categories={filteredCategories} onEdit={openEditModal} onDelete={handleDelete} />

      {totalPages > 1 && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 sm:flex-row sm:items-center sm:px-5">
          <p className="text-sm text-[#6b7280]">
            Page {currentPage} of {totalPages} ({pagination.totalItems} total)
          </p>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                type="button"
                key={page}
                onClick={() => setPage(page)}
                className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage ? "bg-[#0f5132] text-white" : "text-[#6b7280] hover:bg-[#f3f4f6]"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}

      <CategoryModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        onSave={saveCategory}
      />
    </div>
  );
};

export default Categories;
