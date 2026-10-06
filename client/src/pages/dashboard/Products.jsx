import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Ruler, Award, FolderTree, Boxes, SlidersHorizontal, Upload, Layers } from "lucide-react";
import ProductTable from "@/components/dashboard/ProductTable";
import ProductModal from "@/components/dashboard/ProductModal";
import QuickNavBar from "@/components/dashboard/QuickNavBar";
import PageHeader from "@/components/dashboard/PageHeader";
import TableSkeleton from "@/components/dashboard/TableSkeleton";
import Pagination from "@/components/common/Pagination";
import { toast } from "@/components/ui/sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useProduct, { useAdminProducts, useProductStatusCounts } from "@/hooks/use-product";
import useCategory from "@/hooks/use-category";
import useBrand from "@/hooks/use-brand";
import useProductType from "@/hooks/use-productType";

const EMPTY = [];

const PAGE_SIZE = 10;
const STATUS_FILTERS = ["All", "ACTIVE", "DRAFT", "INACTIVE", "ARCHIVED"];

const Products = () => {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [brandFilter, setBrandFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, categoryFilter, brandFilter]);

  const {
    createProduct: createMutation,
    updateProduct: updateMutation,
    deleteProduct: deleteMutation,
  } = useProduct();

  const { products, isLoading, pagination } = useAdminProducts({
    page: currentPage,
    limit: PAGE_SIZE,
    status: statusFilter === "All" ? undefined : statusFilter,
    categoryId: categoryFilter === "All" ? undefined : categoryFilter,
    brandId: brandFilter === "All" ? undefined : brandFilter,
    search,
  });

  const { total, counts } = useProductStatusCounts();

  const { allCategories } = useCategory();
  const { brandsData } = useBrand(1, 200);
  const { data: productTypeData } = useProductType(1, 200);

  const categoriesList = allCategories?.data?.categories || EMPTY;
  const brandsList = brandsData?.data?.brand || EMPTY;
  const productTypesList = productTypeData?.data?.productTypes || EMPTY;

  const categoriesById = useMemo(
    () => Object.fromEntries(categoriesList.map((category) => [category.id, category])),
    [categoriesList]
  );
  const brandsById = useMemo(() => Object.fromEntries(brandsList.map((brand) => [brand.id, brand])), [brandsList]);
  const productTypesById = useMemo(
    () => Object.fromEntries(productTypesList.map((type) => [type.id, type])),
    [productTypesList]
  );

  const totalPages = pagination?.totalPages || 1;

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

  const statCards = [
    { label: "Products", value: total },
    { label: "Active", value: counts.ACTIVE ?? 0 },
    { label: "Drafts", value: counts.DRAFT ?? 0 },
  ];

  const quickLinks = [
    { label: "Variants", icon: Layers, path: "/dashboard/variants" },
    { label: "Units", icon: Ruler, path: "/dashboard/units" },
    { label: "Brands", icon: Award, path: "/dashboard/brands" },
    { label: "Category", icon: FolderTree, path: "/dashboard/category" },
    { label: "Product Type", icon: Boxes, path: "/dashboard/product-type" },
    { label: "Product Attribute", icon: SlidersHorizontal, path: "/dashboard/product-attribute" },
  ];

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Products"
        description="Manage your catalog, pricing and availability."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast("Import CSV isn't wired up yet")}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </button>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
        }
      />

      <QuickNavBar links={quickLinks} />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-white p-4 shadow-card">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
            <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search products..."
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="min-w-37.5 py-2.5">
                <SelectValue>
                  {categoryFilter === "All" ? "All categories" : categoriesList.find((c) => String(c.id) === categoryFilter)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All categories</SelectItem>
                {categoriesList.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="min-w-37.5 py-2.5">
                <SelectValue>
                  {brandFilter === "All" ? "All brands" : brandsById[brandFilter]?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All brands</SelectItem>
                {brandsList.map((brand) => (
                  <SelectItem key={brand.id} value={String(brand.id)}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                statusFilter === status ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {status === "All" ? "All" : status.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={PAGE_SIZE} columns={6} />
      ) : (
        <ProductTable
          products={products}
          categoriesById={categoriesById}
          brandsById={brandsById}
          productTypesById={productTypesById}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      )}

      {!isLoading && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={pagination?.totalItems ?? 0}
          onPageChange={setCurrentPage}
        />
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
