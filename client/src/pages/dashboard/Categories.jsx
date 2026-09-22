import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import CategoryTable from "@/components/dashboard/CategoryTable";
import CategoryModal from "@/components/dashboard/CategoryModal";
import TableSkeleton from "@/components/dashboard/TableSkeleton";
import PageHeader from "@/components/dashboard/PageHeader";
import useCategory from "@/hooks/use-category";

const Categories = () => {
  const location = useLocation();
  const isProductSubRoute = location.pathname === "/dashboard/products/category";
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

  if (error) {
    return <div className="flex items-center justify-center p-10 text-destructive">Failed to load categories.</div>;
  }

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Categories"
        description="Organize products into browsable categories."
        backTo={isProductSubRoute ? "/dashboard/products" : undefined}
        backLabel="Back to Products"
        action={
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        }
      />

      <div className="rounded-xl border border-border bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
            <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search categories..."
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="min-w-[150px] rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={pageSize} columns={5} />
      ) : (
        <CategoryTable categories={filteredCategories} onEdit={openEditModal} onDelete={handleDelete} />
      )}

      {!isLoading && totalPages > 1 && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 sm:flex-row sm:items-center sm:px-5">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({pagination.totalItems} total)
          </p>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                type="button"
                key={page}
                onClick={() => setPage(page)}
                className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
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
