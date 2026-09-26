import { Search, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import BrandTable from "@/components/dashboard/BrandTable";
import useBrand from "@/hooks/use-brand";
import BrandPanel from "@/components/dashboard/BrandModal";
import Pagination from "@/components/common/Pagination";
import PageHeader from "@/components/dashboard/PageHeader";

const BrandPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingBrand, setEditingBrand] = useState(null);
  const { brandsData, isLoading, createMutation, updateMutation, deleteMutation } = useBrand(currentPage, 10);

  const pagination = brandsData?.data?.pagination ?? {};
  const filteredBrands = useMemo(() => {
    const brands = brandsData?.data?.brand ?? [];
    return brands.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [brandsData, searchTerm]);

  const saveBrand = (payload) => {
    if (editingBrand) {
      updateMutation.mutate({ id: editingBrand.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
    setEditingBrand(null);
  };

  const handleDelete = (brandId) => {
    deleteMutation.mutate(brandId);
    if (editingBrand?.id === brandId) setEditingBrand(null);
  };

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Brands"
        description="Manage the brands available to your catalog."
        backTo="/dashboard/products"
        backLabel="Back to Products"
        action={
          <button
            type="button"
            onClick={() => setEditingBrand(null)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add brand
          </button>
        }
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="rounded-xl border border-border bg-white p-4 shadow-card sm:p-6">
            <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search brands..."
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <BrandTable
            brands={filteredBrands}
            onDelete={handleDelete}
            isLoading={isLoading}
            onEdit={setEditingBrand}
            selectedId={editingBrand?.id}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={pagination?.totalPages ?? 0}
            totalItems={pagination?.totalItems ?? 0}
            onPageChange={setCurrentPage}
          />
        </div>

        <BrandPanel brand={editingBrand} onCancel={() => setEditingBrand(null)} onSave={saveBrand} />
      </div>
    </div>
  );
};

export default BrandPage;
