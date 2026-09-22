import { useMemo, useState } from "react";
import { Plus, Search, Ruler, Award, FolderTree, Boxes, SlidersHorizontal, AlertCircle, RefreshCw, Layers } from "lucide-react";
import ProductTable from "@/components/dashboard/ProductTable";
import ProductModal from "@/components/dashboard/ProductModal";
import QuickNavBar from "@/components/dashboard/QuickNavBar";
import PageHeader from "@/components/dashboard/PageHeader";
import TableSkeleton from "@/components/dashboard/TableSkeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import AssignPromotionModal from "@/components/dashboard/AssignPromotionModal";
import useProduct from "@/hooks/use-product";


const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  // const [assignPromotingProduct, setAssignPromotingProduct] = useState(null);
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

  const UPDATE_PRODUCT_FIELDS = [
    "id","name", "sku", "slug", "description", "short_description", "images_url",
    "category_id", "brand_id", "product_type_id", "is_organic", "is_featured",
    "sort_order", "status",
  ];

  const saveProduct = (payload) => {
    if (editingProduct) {
      const data = Object.fromEntries(
        Object.entries(payload).filter(([key]) => UPDATE_PRODUCT_FIELDS.includes(key))
      );
      updateMutation.mutate({ id: editingProduct.id, data: { ...data, id: editingProduct.id } });
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

  const quickLinks = [
    { label: "Variants", icon: Layers, path: "/dashboard/products/variants" },
    { label: "Units", icon: Ruler, path: "/dashboard/products/units" },
    { label: "Brands", icon: Award, path: "/dashboard/products/brands" },
    { label: "Category", icon: FolderTree, path: "/dashboard/products/category" },
    { label: "Product Type", icon: Boxes, path: "/dashboard/products/product-type" },
    { label: "Product Attribute", icon: SlidersHorizontal, path: "/dashboard/products/product-attribute" },
  ];

  if (error) {
    return (
  <div className="flex min-h-[300px] items-center justify-center p-10">
    <div className="flex max-w-md flex-col items-center text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>

      <h3 className="text-base font-semibold text-gray-900">
        Unable to load products
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        Something went wrong while fetching the products. Please try again.
      </p>

      <button
        // onClick={refetch}
        className="mt-5 flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  </div>
);
  }

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Products"
        description="Manage your catalog, pricing and availability."
        action={
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        }
      />
   <QuickNavBar links={quickLinks} />
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
                placeholder="Search products..."
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>

            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="min-w-37.5 py-2.5">
                <SelectValue>{categoryFilter}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={pageSize} columns={5} />
      ) : (
        <ProductTable
          products={filteredProducts}
          onEdit={openEditModal}
          onDelete={handleDelete}
          // onAssignPromotion={(product) => setAssignPromotingProduct(product)}
        />
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
                className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${page === currentPage ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
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
      {/* <AssignPromotionModal 
        isOpen={!!assignPromotingProduct} 
        onClose={() => setAssignPromotingProduct(null)} 
        product={assignPromotingProduct}
        variantId={null} 
      /> */}

     
    </div>
  );
};

export default Products;
