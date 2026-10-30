import { useQuery, useMutation, useQueryClient, useQueries, keepPreviousData } from "@tanstack/react-query";
import ProductApi from "@/apis/productApi";

// Every cached product read after a write: the shop's list (products), the admin table (admin-products), its tab counts
// and the detail pages (product; every id, since some callers key it by the route's string id and some by number).
export const invalidateProductLists = (queryClient) =>
  ["products", "admin-products", "admin-product-count", "product"].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));

// storefront: the shop's list (ACTIVE products with their ACTIVE variants); admin callers leave it off.
const useProduct = ({page = 1, limit = 10,type,catId,search,status,id,storefront} = {}) => {
  const queryClient = useQueryClient();
  // Callers asking for one product (id), a type list or a category's products never read the list/selection queries below.
  const wantsList = !type && !id && !catId;

  // GET - fetch all products with pagination
  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products", page, limit, status, storefront],
    queryFn: () => ProductApi.getAllProducts(page, limit, status, storefront ? { storefront: true } : undefined),
    enabled: wantsList,
  });

  // GET - fetch a single product by id
  const {
    data: productById,
    isLoading: productByIdLoading,
    error: productByIdError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: () => ProductApi.getProductById(id),
    enabled: !!id,
  });

  const {
    data: catProducts,
    isLoading: catProductsIsLoading,
    error: catProductsError,
  } = useQuery({
    queryKey: ["catProducts", catId, page, limit],
    queryFn: () =>
      ProductApi.getProductByCategory(catId, page, limit),
    enabled: !!catId,
  });
  const {
    data:productSelection,
    isLoading:productSelectionLoading,
    error:productSelectionError
  }=useQuery({
    queryKey:["productSelection",search,page,limit],
    queryFn:()=>ProductApi.productSelection(search,page,limit),
    enabled: wantsList && !storefront,
  })
  const {
data:searchedProduct,
isLoading:searchedProductLoading,
error:searchedProductError
  }=useQuery({
    queryKey:["searchProduct",search],
    queryFn:()=>ProductApi.searchVariants(search),
    enabled:!!search
  })
  // POST - create product
  const createMutation = useMutation({
    mutationFn: (data) => ProductApi.createProduct(data),
    onSuccess: () => invalidateProductLists(queryClient),
  });

  // PUT - update product
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ProductApi.updateProduct(id, data),
    onSuccess: () => invalidateProductLists(queryClient),
  });

  // DELETE - delete product
  const deleteMutation = useMutation({
    mutationFn: (id) => ProductApi.deleteProduct(id),
    onSuccess: () => invalidateProductLists(queryClient),
  });
  //product by promotion type
  const productsByType = useQuery({
    queryKey: ["products-by-type", type, page, limit],
    queryFn: () => ProductApi.getProductsByType(type, page, limit),
    enabled: !!type,
  });

  return {
    catProducts,
    catProductsIsLoading,
    catProductsError,
    productSelection,
    productSelectionLoading,
    productSelectionError,
    searchedProduct,
    searchedProductLoading,
    searchedProductError,
    products,
    isLoading,
    error,
    productById,
    productByIdLoading,
    productByIdError,
    createProduct: createMutation,
    updateProduct: updateMutation,
    deleteProduct: deleteMutation,
    productsByType,
  };
};

// GET /product filters (status, category_id, brand_id, search) and paginates on the server.
export const useAdminProducts = ({ page = 1, limit = 10, status, categoryId, brandId, search }) => {
  const query = useQuery({
    queryKey: ["admin-products", page, limit, status, categoryId, brandId, search],
    queryFn: () =>
      ProductApi.getAllProducts(page, limit, status, { category_id: categoryId, brand_id: brandId, search }),
    placeholderData: keepPreviousData,
  });

  return {
    products: query.data?.data?.products || [],
    isLoading: query.isLoading,
    error: query.error,
    pagination: query.data?.data?.pagination || { totalItems: 0, currentPage: page, totalPages: 1 },
  };
};

// No endpoint returns per-status counts, so this fires one lightweight
// (limit=1) query per status and reads totalItems — same approach as
// useOrderStatusCounts in use-order.js.
const PRODUCT_STATUSES = ["ACTIVE", "DRAFT", "INACTIVE", "ARCHIVED"];

export const useProductStatusCounts = () => {
  const results = useQueries({
    queries: [undefined, ...PRODUCT_STATUSES].map((status) => ({
      queryKey: ["admin-product-count", status],
      queryFn: () => ProductApi.getAllProducts(1, 1, status),
      staleTime: 30000,
    })),
  });

  const [allResult, ...statusResults] = results;
  const counts = {};
  PRODUCT_STATUSES.forEach((status, index) => {
    counts[status] = statusResults[index].data?.data?.pagination?.totalItems ?? 0;
  });

  return {
    total: allResult.data?.data?.pagination?.totalItems ?? 0,
    counts,
    isLoading: results.some((result) => result.isLoading),
  };
};

export default useProduct;
