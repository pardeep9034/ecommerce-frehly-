import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import ProductTable from "@/components/freshly/ProductTable";
import ProductModal from "@/components/freshly/ProductModal";
import AssignPromotionModal from "@/components/freshly/AssignPromotionModal";
import useProduct from "@/hooks/use-product";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [assignPromotingProduct, setAssignPromotingProduct] = useState(null);

  const pageSize = 5;

  const {
    products: productsData,
    isLoading,
    error,
    createProduct: createMutation,
    updateProduct: updateMutation,
    deleteProduct: deleteMutation,
  } = useProduct(currentPage, pageSize);

  const productsList = productsData?.data?.products || productsData?.products || [];

  const pagination = productsData?.data?.pagination || productsData?.pagination || {};

  const categories = useMemo(() => {
    const cats = productsList.map((item) => item.Category?.name || item.category?.name || item.category).filter(Boolean);
    return ["All", ...new Set(cats)];
  }, [productsList]);

  const filteredProducts = useMemo(() => {
    return productsList.filter((product) => {
      const name = product.name || "";
      const category = product.Category?.name || product.category?.name || product.category || "";
      const searchMatch = name.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = categoryFilter === "All" || category === categoryFilter;
      return searchMatch && categoryMatch;
    });
  }, [productsList, searchTerm, categoryFilter]);

  const totalPages = pagination.totalPages || 1;

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const saveProduct = (payload) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = (productId) => {
    deleteMutation.mutate(productId);
  };

  const setPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-10 text-[#6b7280]">Loading products...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center p-10 text-red-500">Failed to load products.</div>;
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
                placeholder="Search products..."
                className="w-full bg-transparent text-sm text-[#1f2937] outline-none placeholder:text-[#6b7280]"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="min-w-[150px] rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f5132] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0b4128]"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      <ProductTable 
          products={filteredProducts} 
          onEdit={openEditModal} 
          onDelete={handleDelete} 
          onAssignPromotion={(product) => setAssignPromotingProduct(product)} 
      />

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
                className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${page === currentPage ? "bg-[#0f5132] text-white" : "text-[#6b7280] hover:bg-[#f3f4f6]"
                  }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}

      <ProductModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSave={saveProduct}
      />
      <AssignPromotionModal 
        isOpen={!!assignPromotingProduct} 
        onClose={() => setAssignPromotingProduct(null)} 
        product={assignPromotingProduct}
        variantId={null} 
      />

     
    </div>
  );
};

export default Products;
