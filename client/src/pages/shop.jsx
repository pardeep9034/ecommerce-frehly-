import React, { useMemo, useState } from "react";
import { 
  Search, 
  SlidersHorizontal, 
  Grid, 
  List as ListIcon, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  Filter,
  X
} from "lucide-react";
import useProduct from "../hooks/use-product";
import useCategory from "../hooks/use-category";
import ShopProductCard from "../components/common/ShopProductCard";

const Shop = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const pageSize = 12;

  const {
    products: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useProduct(currentPage, pageSize);

  const {
    categories: categoriesData,
  } = useCategory(1, 100);

  const productsList = productsData?.data?.products || productsData?.products || [];
  const pagination = productsData?.data?.pagination || productsData?.pagination || {};
  const categoriesList = categoriesData?.data?.categories || categoriesData?.categories || [];

  const categories = useMemo(() => {
    const cats = categoriesList.map((c) => c.name);
    return ["All", ...cats];
  }, [categoriesList]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = productsList.filter((product) => {
      const name = product.name || "";
      const category = product.Category?.name || product.category?.name || product.category || "";
      const searchMatch = name.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = categoryFilter === "All" || category === categoryFilter;
      return searchMatch && categoryMatch;
    });

    // Simple sorting logic (can be expanded based on API capabilities)
    if (sortBy === "price-low") {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    return result;
  }, [productsList, searchTerm, categoryFilter, sortBy]);

  const totalPages = pagination.totalPages || 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (productsError) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center p-10 text-center bg-white">
        <div className="mb-6 rounded-full bg-red-50 p-6 animate-bounce">
          <SlidersHorizontal className="h-10 w-10 text-red-500" />
        </div>
        <h3 className="text-2xl font-black text-[#1f2937]">Something went wrong</h3>
        <p className="mt-2 max-w-sm text-[#6b7280]">We couldn't load the products. Please check your connection and try again.</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 rounded-full bg-[#0f5132] px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#0b4128]"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div className="bg-white border-b border-[#e5e7eb] sticky top-0 z-20">
        <div className="mx-auto max-w-screen-2xl px-3 py-4 sm:px-6 lg:px-8">
           <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-black tracking-tight text-[#1f2937] sm:text-3xl">Shop Organic</h1>
                <p className="text-[10px] sm:text-sm font-medium text-[#6b7280]">Fresh, healthy essentials for your home.</p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative group flex-1 sm:w-80">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6b7280] group-focus-within:text-[#0f5132]" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search fresh products..."
                    className="w-full rounded-full border border-[#e5e7eb] bg-[#f9fafb] py-2 pl-9 pr-3 text-xs sm:text-sm outline-none transition-all focus:border-[#0f5132] focus:bg-white focus:ring-4 focus:ring-[#0f5132]/5"
                  />
                </div>
                
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="lg:hidden flex h-9 w-9 items-center justify-center rounded-full bg-[#0f5132] text-white shadow-lg shadow-green-900/20"
                >
                  <Filter className="h-4 w-4" />
                </button>
              </div>
           </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-2xl px-3 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          
          {/* Sidebar Filters - Desktop */}
          <aside className={`lg:w-72 shrink-0 ${isFilterOpen ? 'fixed inset-0 z-50 bg-white p-6' : 'hidden lg:block'}`}>
            <div className="lg:sticky lg:top-32">
              <div className="flex items-center justify-between mb-8 lg:hidden">
                <h2 className="text-2xl font-black">Filters</h2>
                <button onClick={() => setIsFilterOpen(false)} className="p-2"><X className="h-6 w-6"/></button>
              </div>

              <div className="space-y-8">
                {/* Categories */}
                <div>
                  <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-[#1f2937]">Categories</h3>
                  <div className="flex flex-col gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          setCategoryFilter(category);
                          setCurrentPage(1);
                          setIsFilterOpen(false);
                        }}
                        className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                          categoryFilter === category 
                            ? "bg-[#0f5132] text-white shadow-md shadow-green-900/20" 
                            : "text-[#4b5563] hover:bg-white hover:text-[#0f5132]"
                        }`}
                      >
                        {category}
                        {categoryFilter === category && <ChevronRight className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-[#1f2937]">Sort By</h3>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: 'newest', label: 'Newest Arrivals' },
                      { id: 'price-low', label: 'Price: Low to High' },
                      { id: 'price-high', label: 'Price: High to Low' },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSortBy(option.id)}
                        className={`text-left rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                          sortBy === option.id ? "text-[#0f5132]" : "text-[#6b7280] hover:text-[#1f2937]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-medium text-[#6b7280]">
                Showing <span className="font-bold text-[#1f2937]">{filteredAndSortedProducts.length}</span> results
              </p>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setViewMode("grid")}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                    viewMode === "grid" ? "bg-white text-[#0f5132] shadow-sm ring-1 ring-[#e5e7eb]" : "text-[#6b7280] hover:bg-white"
                  }`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setViewMode("list")}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                    viewMode === "list" ? "bg-white text-[#0f5132] shadow-sm ring-1 ring-[#e5e7eb]" : "text-[#6b7280] hover:bg-white"
                  }`}
                >
                  <ListIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex flex-col rounded-3xl bg-white p-4">
                    <div className="aspect-square rounded-2xl bg-gray-100" />
                    <div className="mt-4 space-y-3">
                      <div className="h-4 w-1/3 rounded bg-gray-100" />
                      <div className="h-6 w-3/4 rounded bg-gray-100" />
                      <div className="h-4 w-1/2 rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAndSortedProducts.length > 0 ? (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-3" 
                : "flex flex-col gap-4 sm:gap-6"
              }>
                {filteredAndSortedProducts.map((product) => (
                  <ShopProductCard key={product.id} product={product} viewMode={viewMode} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[3rem] bg-white p-12 text-center shadow-sm">
                <div className="mb-6 rounded-full bg-[#f9fafb] p-8">
                  <Search className="h-12 w-12 text-[#6b7280]" />
                </div>
                <h3 className="text-2xl font-black text-[#1f2937]">No products found</h3>
                <p className="mt-2 max-w-xs text-[#6b7280]">Try adjusting your filters or search terms to find what you're looking for.</p>
                <button 
                  onClick={() => {setSearchTerm(""); setCategoryFilter("All");}}
                  className="mt-8 text-sm font-black text-[#0f5132] underline decoration-2 underline-offset-4"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {!productsLoading && totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1f2937] shadow-sm transition-all hover:bg-[#0f5132] hover:text-white disabled:opacity-30 ring-1 ring-[#e5e7eb]"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`h-12 min-w-[48px] rounded-2xl text-sm font-black transition-all ${
                        page === currentPage
                          ? "bg-[#0f5132] text-white shadow-lg shadow-green-900/20"
                          : "bg-white text-[#6b7280] hover:bg-gray-50 ring-1 ring-[#e5e7eb]"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1f2937] shadow-sm transition-all hover:bg-[#0f5132] hover:text-white disabled:opacity-30 ring-1 ring-[#e5e7eb]"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Shop;
