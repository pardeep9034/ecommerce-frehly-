import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import CategoryTable from "@/components/dashboard/CategoryTable";
import CategoryPanel from "@/components/dashboard/CategoryModal";
import TableSkeleton from "@/components/dashboard/TableSkeleton";
import PageHeader from "@/components/dashboard/PageHeader";
import Pagination from "@/components/common/Pagination";
import useCategory from "@/hooks/use-category";

// Large enough that a typical category tree fits on one page — parent/child rows can otherwise
// land on different pages and break the tree view (see ADMIN_PANEL_REDESIGN.md).
const PAGE_SIZE = 50;

const STATUS_OPTIONS = ["All", "Active", "Inactive"];

const Categories = () => {
  const location = useLocation();
  const isProductSubRoute = location.pathname === "/dashboard/products/category";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCategory, setEditingCategory] = useState(null);

  const {
    categories: categoriesData,
    isLoading,
    error,
    createCategory: createMutation,
    updateCategory: updateMutation,
    deleteCategory: deleteMutation,
  } = useCategory(currentPage, PAGE_SIZE);

  const categoriesList = categoriesData?.data?.categories || [];
  const pagination = categoriesData?.data?.pagination || {};

  const matchesFilters = (category) => {
    const term = searchTerm.trim().toLowerCase();
    const searchMatch =
      !term ||
      category.name.toLowerCase().includes(term) ||
      (category.slug && category.slug.toLowerCase().includes(term));
    const statusMatch =
      statusFilter === "All" ||
      (statusFilter === "Active" && category.is_active) ||
      (statusFilter === "Inactive" && !category.is_active);
    return searchMatch && statusMatch;
  };

  const treeRoots = useMemo(() => {
    if (searchTerm.trim()) return null;
    return categoriesList
      .filter((category) => !category.parent_id)
      .filter(matchesFilters)
      .map((root) => ({ ...root, children: (root.children || []).filter(matchesFilters) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesList, statusFilter]);

  const flatMatches = useMemo(() => {
    if (!searchTerm.trim()) return null;
    return categoriesList.filter(matchesFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesList, searchTerm, statusFilter]);

  const saveCategory = (payload) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
    setEditingCategory(null);
  };

  const handleDelete = (categoryId) => {
    deleteMutation.mutate(categoryId);
    if (editingCategory?.id === categoryId) setEditingCategory(null);
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
            onClick={() => setEditingCategory(null)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        }
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="rounded-xl border border-border bg-white p-5 shadow-card sm:p-6">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search categories..."
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>

              <div role="group" className="flex gap-1.5">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={statusFilter === option}
                    onClick={() => setStatusFilter(option)}
                    className={`h-9 rounded-full px-3.5 text-xs font-semibold transition-colors ${
                      statusFilter === option
                        ? "bg-primary text-white"
                        : "border border-border bg-white text-foreground hover:bg-muted"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : (
            <CategoryTable
              roots={treeRoots}
              flat={flatMatches}
              onEdit={setEditingCategory}
              onDelete={handleDelete}
              selectedId={editingCategory?.id}
            />
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={pagination?.totalPages ?? 0}
            totalItems={pagination?.totalItems ?? 0}
            onPageChange={setCurrentPage}
          />
        </div>

        <CategoryPanel category={editingCategory} onCancel={() => setEditingCategory(null)} onSave={saveCategory} />
      </div>
    </div>
  );
};

export default Categories;
