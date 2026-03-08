import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import ProductTable from "@/components/freshly/ProductTable";
import ProductModal from "@/components/freshly/ProductModal";

const INITIAL_PRODUCTS = [
  { id: 1, name: "Organic Bananas", category: "Fruits", price: 2.99, stock: 150, status: "Active", emoji: "🍌" },
  { id: 2, name: "Fresh Salmon Fillet", category: "Meat", price: 12.99, stock: 3, status: "Active", emoji: "🐟" },
  { id: 3, name: "Whole Milk 1L", category: "Dairy", price: 3.49, stock: 8, status: "Active", emoji: "🥛" },
  { id: 4, name: "Sourdough Bread", category: "Bakery", price: 5.99, stock: 12, status: "Active", emoji: "🍞" },
  { id: 5, name: "Greek Yogurt", category: "Dairy", price: 4.29, stock: 45, status: "Active", emoji: "🥣" },
  { id: 6, name: "Avocados (3-pack)", category: "Fruits", price: 6.99, stock: 67, status: "Active", emoji: "🥑" },
  { id: 7, name: "Orange Juice 1L", category: "Beverages", price: 4.99, stock: 90, status: "Inactive", emoji: "🍊" },
  { id: 8, name: "Frozen Pizza", category: "Frozen", price: 7.49, stock: 35, status: "Active", emoji: "🍕" },
];

const Products = () => {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const pageSize = 5;

  const categories = useMemo(() => ["All", ...new Set(INITIAL_PRODUCTS.map((item) => item.category))], []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = categoryFilter === "All" || product.category === categoryFilter;
      return searchMatch && categoryMatch;
    });
  }, [products, searchTerm, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage]);

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
      setProducts((prev) =>
        prev.map((product) =>
          product.id === editingProduct.id ? { ...product, ...payload, id: editingProduct.id } : product
        )
      );
      return;
    }

    setProducts((prev) => [...prev, { ...payload, id: Date.now(), emoji: "🛒" }]);
  };

  const deleteProduct = (productId) => {
    setProducts((prev) => prev.filter((product) => product.id !== productId));
  };

  const setPage = (page) => {
    if (page < 1 || page > totalPages) {
      return;
    }
    setCurrentPage(page);
  };

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

      <ProductTable products={paginatedProducts} onEdit={openEditModal} onDelete={deleteProduct} />

      {totalPages > 1 && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 sm:flex-row sm:items-center sm:px-5">
          <p className="text-sm text-[#6b7280]">
            Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredProducts.length)} of{" "}
            {filteredProducts.length}
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

      <ProductModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSave={saveProduct}
      />
    </div>
  );
};

export default Products;
